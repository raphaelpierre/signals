from __future__ import annotations

import json
import logging
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

import ccxt
from redis import Redis
from rq import Queue
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.signal import Signal

logger = logging.getLogger(__name__)


def _exchange() -> ccxt.Exchange:
    exchange_class = getattr(ccxt, settings.ccxt_exchange)
    exchange: ccxt.Exchange = exchange_class({"enableRateLimit": True})
    return exchange


def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """Calculate Relative Strength Index"""
    if len(prices) < period + 1:
        return 50.0
    
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return float(rsi)


def calculate_bollinger_bands(prices: List[float], period: int = 20, std_dev: float = 2) -> Tuple[float, float, float]:
    """Calculate Bollinger Bands"""
    if len(prices) < period:
        return prices[-1], prices[-1], prices[-1]
    
    recent_prices = np.array(prices[-period:])
    sma = np.mean(recent_prices)
    std = np.std(recent_prices)
    
    upper_band = sma + (std_dev * std)
    lower_band = sma - (std_dev * std)
    
    return float(lower_band), float(sma), float(upper_band)


def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[float, float, float]:
    """Calculate MACD"""
    if len(prices) < slow:
        return 0.0, 0.0, 0.0
    
    prices_array = np.array(prices)
    
    # Calculate EMAs
    ema_fast = prices_array[-1]  # Simplified EMA calculation
    ema_slow = np.mean(prices_array[-slow:])
    
    macd_line = ema_fast - ema_slow
    signal_line = macd_line * 0.9  # Simplified signal line
    histogram = macd_line - signal_line
    
    return float(macd_line), float(signal_line), float(histogram)


def analyze_volume_pattern(volumes: List[float]) -> float:
    """Analyze volume pattern and return a score 0-100"""
    if len(volumes) < 10:
        return 50.0
    
    recent_avg = np.mean(volumes[-5:])
    historical_avg = np.mean(volumes[-20:-5])
    
    if historical_avg == 0:
        return 50.0
    
    volume_ratio = recent_avg / historical_avg
    
    # Convert to 0-100 scale
    score = min(100, max(0, (volume_ratio - 0.5) * 100))
    return float(score)


def determine_market_conditions(prices: List[float], rsi: float, macd_histogram: float) -> str:
    """Determine overall market conditions"""
    if len(prices) < 10:
        return "neutral"
    
    price_trend = (prices[-1] - prices[-10]) / prices[-10]
    
    bullish_signals = 0
    bearish_signals = 0
    
    # Price trend
    if price_trend > 0.02:  # 2% uptrend
        bullish_signals += 1
    elif price_trend < -0.02:  # 2% downtrend
        bearish_signals += 1
    
    # RSI signals
    if rsi > 70:
        bearish_signals += 1
    elif rsi < 30:
        bullish_signals += 1
    
    # MACD signals
    if macd_histogram > 0:
        bullish_signals += 1
    else:
        bearish_signals += 1
    
    if bullish_signals > bearish_signals:
        return "bullish"
    elif bearish_signals > bullish_signals:
        return "bearish"
    else:
        return "neutral"


def calculate_confidence_score(
    rsi: float, 
    bb_position: float, 
    volume_score: float, 
    macd_histogram: float,
    direction: str
) -> float:
    """Calculate confidence score for the signal"""
    confidence = 50.0  # Base confidence
    
    # RSI contribution
    if direction == "LONG":
        if rsi < 40:  # Oversold
            confidence += 20
        elif rsi < 50:
            confidence += 10
        elif rsi > 70:  # Overbought
            confidence -= 15
    else:  # SHORT
        if rsi > 60:  # Overbought
            confidence += 20
        elif rsi > 50:
            confidence += 10
        elif rsi < 30:  # Oversold
            confidence -= 15
    
    # Bollinger Bands contribution
    if direction == "LONG" and bb_position < 0.3:  # Near lower band
        confidence += 15
    elif direction == "SHORT" and bb_position > 0.7:  # Near upper band
        confidence += 15
    
    # Volume contribution
    if volume_score > 60:
        confidence += 10
    elif volume_score < 40:
        confidence -= 5
    
    # MACD contribution
    if (direction == "LONG" and macd_histogram > 0) or (direction == "SHORT" and macd_histogram < 0):
        confidence += 10
    else:
        confidence -= 5
    
    return min(100, max(0, confidence))


def generate_signal_rationale(
    rsi: float,
    bb_position: float,
    macd_histogram: float,
    volume_score: float,
    direction: str,
    market_conditions: str
) -> List[str]:
    """Generate human-readable rationale for signal"""
    rationale = []
    
    # RSI rationale
    if direction == "LONG" and rsi < 40:
        rationale.append(f"RSI at {rsi:.1f} indicates oversold conditions, suggesting potential reversal")
    elif direction == "SHORT" and rsi > 60:
        rationale.append(f"RSI at {rsi:.1f} indicates overbought conditions, suggesting potential correction")
    
    # Bollinger Bands rationale
    if direction == "LONG" and bb_position < 0.3:
        rationale.append(f"Price near lower Bollinger Band ({(bb_position*100):.1f}%), suggesting support level")
    elif direction == "SHORT" and bb_position > 0.7:
        rationale.append(f"Price near upper Bollinger Band ({(bb_position*100):.1f}%), suggesting resistance level")
    
    # MACD rationale
    if direction == "LONG" and macd_histogram > 0:
        rationale.append(f"Positive MACD histogram showing bullish momentum")
    elif direction == "SHORT" and macd_histogram < 0:
        rationale.append(f"Negative MACD histogram showing bearish momentum")
    
    # Volume rationale
    if volume_score > 60:
        rationale.append(f"Above-average volume ({volume_score:.1f}%) increasing confidence in the move")
    
    # Market conditions
    if direction == "LONG" and market_conditions == "bullish":
        rationale.append("Overall bullish market conditions support upward movement")
    elif direction == "SHORT" and market_conditions == "bearish":
        rationale.append("Overall bearish market conditions support downward movement")
    
    # Ensure we have at least one rationale point
    if not rationale:
        if direction == "LONG":
            rationale.append("Technical indicators suggest potential upward price movement")
        else:
            rationale.append("Technical indicators suggest potential downward price movement")
    
    return rationale[:3]  # Return max 3 points


def determine_regime(
    prices: List[float],
    volumes: List[float],
    rsi: float,
    market_conditions: str
) -> Dict[str, str]:
    """Determine market regime conditions"""
    # Trend analysis
    short_trend = np.mean(prices[-5:])
    long_trend = np.mean(prices[-20:])
    trend = "up" if short_trend > long_trend * 1.005 else "down" if short_trend < long_trend * 0.995 else "sideways"
    
    # Volatility analysis
    recent_volatility = np.std(prices[-10:]) / np.mean(prices[-10:])
    historical_volatility = np.std(prices[-30:]) / np.mean(prices[-30:])
    volatility = "high" if recent_volatility > historical_volatility * 1.2 else "low" if recent_volatility < historical_volatility * 0.8 else "normal"
    
    # Liquidity/Volume analysis
    recent_volume = np.mean(volumes[-5:])
    historical_volume = np.mean(volumes[-20:])
    liquidity = "high" if recent_volume > historical_volume * 1.2 else "low" if recent_volume < historical_volume * 0.8 else "normal"
    
    return {
        "trend": trend,
        "vol": volatility,
        "liq": liquidity
    }


def generate_signal_for_pair(db: Session, symbol: str) -> Optional[Signal]:
    exchange = _exchange()
    try:
        # Fetch more historical data for better analysis
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe="1h", limit=100)
        if not ohlcv or len(ohlcv) < 50:
            logger.warning("Insufficient data for %s", symbol)
            return None
            
    except Exception as exc:  # pragma: no cover - network failure fallback
        logger.exception("Failed to fetch data for %s: %s", symbol, exc)
        return None
    
    # Extract price and volume data
    closes = [float(candle[4]) for candle in ohlcv]
    highs = [float(candle[2]) for candle in ohlcv]
    lows = [float(candle[3]) for candle in ohlcv]
    volumes = [float(candle[5]) for candle in ohlcv]
    
    if len(closes) < 50:
        return None
    
    current_price = closes[-1]
    
    # Calculate technical indicators
    rsi = calculate_rsi(closes)
    bb_lower, bb_middle, bb_upper = calculate_bollinger_bands(closes)
    macd_line, macd_signal, macd_histogram = calculate_macd(closes)
    volume_score = analyze_volume_pattern(volumes)
    market_conditions = determine_market_conditions(closes, rsi, macd_histogram)
    
    # Determine signal direction using enhanced logic
    bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if bb_upper != bb_lower else 0.5
    
    direction = None
    entry_price = current_price
    
    # Enhanced signal generation logic
    if rsi < 35 and bb_position < 0.3 and macd_histogram > 0:  # Strong buy signal
        direction = "LONG"
    elif rsi > 65 and bb_position > 0.7 and macd_histogram < 0:  # Strong sell signal
        direction = "SHORT"
    elif rsi < 45 and bb_position < 0.4 and volume_score > 50:  # Moderate buy signal
        direction = "LONG"
    elif rsi > 55 and bb_position > 0.6 and volume_score > 50:  # Moderate sell signal
        direction = "SHORT"
    
    if not direction:
        logger.info("No clear signal for %s at this time", symbol)
        return None
    
    # Calculate targets and stop loss with better risk management
    atr = np.mean([highs[i] - lows[i] for i in range(-20, 0)])  # Average True Range for volatility
    
    if direction == "LONG":
        target_price = entry_price * 1.015  # 1.5% target
        stop_loss = entry_price * (1 - (atr / entry_price) * 1.5)  # ATR-based stop loss
    else:
        target_price = entry_price * 0.985  # 1.5% target
        stop_loss = entry_price * (1 + (atr / entry_price) * 1.5)  # ATR-based stop loss
    
    # Calculate risk-reward ratio
    risk = abs(entry_price - stop_loss)
    reward = abs(target_price - entry_price)
    risk_reward_ratio = reward / risk if risk > 0 else 0
    
    # Calculate confidence score
    confidence = calculate_confidence_score(rsi, bb_position, volume_score, macd_histogram, direction)
    
    # Skip signals with poor risk-reward ratio or low confidence
    if risk_reward_ratio < 1.2 or confidence < 60:
        logger.info("Signal for %s rejected - RR: %.2f, Confidence: %.1f", symbol, risk_reward_ratio, confidence)
        return None
    
    # Calculate quality score based on multiple factors
    quality_score = min(100, max(0, confidence * 0.7 + (risk_reward_ratio * 10) * 0.3))
    if risk_reward_ratio > 2:
        quality_score += 5
        
    # Prepare technical indicators data
    technical_indicators = {
        "rsi": round(rsi, 2),
        "bollinger_position": round(bb_position * 100, 1),
        "macd_histogram": round(macd_histogram, 4),
        "volume_score": round(volume_score, 1),
        "atr": round(atr, 4)
    }
    
    # Generate human-readable rationale
    rationale = generate_signal_rationale(
        rsi,
        bb_position,
        macd_histogram,
        volume_score,
        direction,
        market_conditions
    )
    
    # Determine market regime
    regime = determine_regime(
        closes,
        volumes,
        rsi,
        market_conditions
    )
    
    # Mock backtest metrics based on the strategy (in production, these would come from actual backtest results)
    bt_winrate = 0.55 + (confidence / 1000)  # 55-65% range
    bt_pf = 1.5 + (risk_reward_ratio / 10)   # 1.5-2.5 range
    
    # Simulate latency in signal generation
    latency_ms = int(np.random.randint(50, 200))
    
    signal = Signal(
        symbol=symbol,
        timeframe="1h",
        direction=direction,
        entry_price=entry_price,
        target_price=target_price,
        stop_loss=stop_loss,
        strategy="enhanced-mean-reversion",
        strategy_id="emr-v1",  # Strategy identifier for methodology page
        confidence=confidence,
        quality_score=quality_score,
        risk_reward_ratio=risk_reward_ratio,
        volume_score=volume_score,
        technical_indicators=json.dumps(technical_indicators),
        rationale=json.dumps(rationale),
        regime=json.dumps(regime),
        market_conditions=market_conditions,
        latency_ms=latency_ms,
        bt_winrate=bt_winrate,
        bt_pf=bt_pf,
        risk_pct=0.5,  # Default risk percentage
        is_active=True,
        expires_at=datetime.utcnow() + timedelta(hours=24),  # Signals expire after 24 hours
        created_at=datetime.utcnow(),
    )
    
    try:
        db.add(signal)
        db.commit()
        logger.info("Generated %s signal for %s - Confidence: %.1f%%, RR: %.2f", 
                   direction, symbol, confidence, risk_reward_ratio)
        return signal
    except Exception as e:
        logger.error("Failed to save signal for %s: %s", symbol, e)
        db.rollback()
        return None


def generate_signals() -> Dict[str, int]:
    db = SessionLocal()
    results = {"generated": 0, "skipped": 0, "errors": 0}
    
    try:
        for symbol in settings.ccxt_trading_pairs:
            try:
                signal = generate_signal_for_pair(db, symbol)
                if signal:
                    results["generated"] += 1
                else:
                    results["skipped"] += 1
            except Exception as e:
                logger.error("Error processing %s: %s", symbol, e)
                results["errors"] += 1
    finally:
        db.close()
    
    logger.info("Signal generation completed: %s", results)
    return results


redis_conn = Redis.from_url(settings.redis_url)
queue = Queue("signals", connection=redis_conn, default_timeout=300)


def enqueue_signal_job() -> str:
    job = queue.enqueue(generate_signals)
    logger.info("Enqueued signal generation job %s", job.id)
    return job.id
