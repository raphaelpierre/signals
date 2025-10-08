"""Backtesting service for trading strategies."""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import ccxt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.signal import Signal

logger = logging.getLogger(__name__)


class BacktestResult:
    """Container for backtest results."""

    def __init__(self):
        self.trades: List[Dict] = []
        self.total_trades = 0
        self.winning_trades = 0
        self.losing_trades = 0
        self.total_profit = 0.0
        self.total_loss = 0.0
        self.max_drawdown = 0.0
        self.sharpe_ratio = 0.0
        self.profit_factor = 0.0
        self.win_rate = 0.0
        self.avg_win = 0.0
        self.avg_loss = 0.0
        self.largest_win = 0.0
        self.largest_loss = 0.0
        self.consecutive_wins = 0
        self.consecutive_losses = 0
        self.max_consecutive_wins = 0
        self.max_consecutive_losses = 0

    def add_trade(
        self,
        entry_price: float,
        exit_price: float,
        direction: str,
        entry_time: datetime,
        exit_time: datetime,
        reason: str,
        pnl: float
    ):
        """Add a trade to the results."""
        trade = {
            "entry_price": entry_price,
            "exit_price": exit_price,
            "direction": direction,
            "entry_time": entry_time.isoformat(),
            "exit_time": exit_time.isoformat(),
            "reason": reason,
            "pnl": pnl,
            "pnl_pct": (pnl / entry_price) * 100
        }
        self.trades.append(trade)
        self.total_trades += 1

        if pnl > 0:
            self.winning_trades += 1
            self.total_profit += pnl
            self.consecutive_wins += 1
            self.consecutive_losses = 0
            self.max_consecutive_wins = max(self.max_consecutive_wins, self.consecutive_wins)
            self.largest_win = max(self.largest_win, pnl)
        else:
            self.losing_trades += 1
            self.total_loss += abs(pnl)
            self.consecutive_losses += 1
            self.consecutive_wins = 0
            self.max_consecutive_losses = max(self.max_consecutive_losses, self.consecutive_losses)
            self.largest_loss = max(self.largest_loss, abs(pnl))

    def calculate_metrics(self):
        """Calculate final metrics."""
        if self.total_trades == 0:
            return

        self.win_rate = self.winning_trades / self.total_trades
        self.avg_win = self.total_profit / self.winning_trades if self.winning_trades > 0 else 0
        self.avg_loss = self.total_loss / self.losing_trades if self.losing_trades > 0 else 0
        self.profit_factor = self.total_profit / self.total_loss if self.total_loss > 0 else float('inf')

        # Calculate Sharpe ratio (simplified)
        if len(self.trades) > 1:
            returns = [t["pnl_pct"] for t in self.trades]
            avg_return = np.mean(returns)
            std_return = np.std(returns)
            self.sharpe_ratio = (avg_return / std_return) * np.sqrt(252) if std_return > 0 else 0

        # Calculate max drawdown
        cumulative_pnl = 0
        peak = 0
        max_dd = 0
        for trade in self.trades:
            cumulative_pnl += trade["pnl"]
            peak = max(peak, cumulative_pnl)
            drawdown = peak - cumulative_pnl
            max_dd = max(max_dd, drawdown)
        self.max_drawdown = max_dd

    def to_dict(self) -> Dict:
        """Convert results to dictionary."""
        return {
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate": round(self.win_rate * 100, 2),
            "profit_factor": round(self.profit_factor, 2),
            "total_profit": round(self.total_profit, 2),
            "total_loss": round(self.total_loss, 2),
            "net_profit": round(self.total_profit - self.total_loss, 2),
            "avg_win": round(self.avg_win, 2),
            "avg_loss": round(self.avg_loss, 2),
            "largest_win": round(self.largest_win, 2),
            "largest_loss": round(self.largest_loss, 2),
            "max_drawdown": round(self.max_drawdown, 2),
            "sharpe_ratio": round(self.sharpe_ratio, 2),
            "max_consecutive_wins": self.max_consecutive_wins,
            "max_consecutive_losses": self.max_consecutive_losses,
            "trades": self.trades
        }


class BacktestEngine:
    """Engine for backtesting trading strategies."""

    def __init__(self, exchange_name: str = None):
        self.exchange_name = exchange_name or settings.ccxt_exchange
        exchange_class = getattr(ccxt, self.exchange_name)
        self.exchange = exchange_class({"enableRateLimit": True})

    def fetch_historical_data(
        self,
        symbol: str,
        timeframe: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[List]:
        """Fetch historical OHLCV data."""
        try:
            since = int(start_date.timestamp() * 1000)
            all_candles = []

            while since < int(end_date.timestamp() * 1000):
                candles = self.exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=1000)
                if not candles:
                    break

                all_candles.extend(candles)
                since = candles[-1][0] + 1

                # Rate limiting
                import time
                time.sleep(self.exchange.rateLimit / 1000)

            logger.info("Fetched %d candles for %s from %s to %s",
                       len(all_candles), symbol, start_date, end_date)
            return all_candles

        except Exception as e:
            logger.error("Error fetching historical data: %s", e)
            return []

    def simulate_signal_execution(
        self,
        signal: Signal,
        candles: List[List],
        signal_time_idx: int
    ) -> Optional[Tuple[str, float, datetime]]:
        """
        Simulate signal execution and determine outcome.

        Returns: (exit_reason, exit_price, exit_time) or None if signal not triggered
        """
        entry_price = signal.entry_price
        target_price = signal.target_price
        stop_loss = signal.stop_loss
        direction = signal.direction

        # Look ahead up to 24 hours or 24 candles (for 1h timeframe)
        max_candles_ahead = 24
        for i in range(signal_time_idx + 1, min(signal_time_idx + max_candles_ahead, len(candles))):
            candle = candles[i]
            timestamp = datetime.fromtimestamp(candle[0] / 1000)
            low = candle[3]
            high = candle[2]
            close = candle[4]

            if direction == "LONG":
                # Check if stop loss hit
                if low <= stop_loss:
                    return ("stop_loss", stop_loss, timestamp)
                # Check if target hit
                if high >= target_price:
                    return ("target", target_price, timestamp)
            else:  # SHORT
                # Check if stop loss hit
                if high >= stop_loss:
                    return ("stop_loss", stop_loss, timestamp)
                # Check if target hit
                if low <= target_price:
                    return ("target", target_price, timestamp)

        # Signal expired without hitting target or stop
        last_candle = candles[min(signal_time_idx + max_candles_ahead, len(candles) - 1)]
        exit_time = datetime.fromtimestamp(last_candle[0] / 1000)
        return ("expired", last_candle[4], exit_time)

    def backtest_strategy(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1h"
    ) -> BacktestResult:
        """
        Backtest the signal generation strategy.

        Args:
            symbol: Trading pair to backtest
            start_date: Start date for backtest
            end_date: End date for backtest
            timeframe: Candle timeframe

        Returns:
            BacktestResult object with performance metrics
        """
        result = BacktestResult()

        # Fetch historical data
        candles = self.fetch_historical_data(symbol, timeframe, start_date, end_date)
        if not candles or len(candles) < 100:
            logger.warning("Insufficient historical data for backtest")
            return result

        # Generate signals on historical data
        logger.info("Generating signals on historical data...")

        for i in range(100, len(candles)):
            # Get historical data up to this point
            lookback_candles = candles[max(0, i-100):i]
            closes = [c[4] for c in lookback_candles]

            # Import here to avoid circular dependency
            from app.workers.tasks import (
                calculate_rsi,
                calculate_bollinger_bands,
                calculate_macd,
                analyze_volume_pattern
            )

            volumes = [c[5] for c in lookback_candles]
            current_price = closes[-1]

            # Calculate indicators
            rsi = calculate_rsi(closes)
            bb_lower, bb_middle, bb_upper = calculate_bollinger_bands(closes)
            macd_line, macd_signal, macd_histogram = calculate_macd(closes)
            volume_score = analyze_volume_pattern(volumes)

            bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if bb_upper != bb_lower else 0.5

            # Generate signal using same logic as production
            direction = None
            if rsi < 35 and bb_position < 0.3 and macd_histogram > 0:
                direction = "LONG"
            elif rsi > 65 and bb_position > 0.7 and macd_histogram < 0:
                direction = "SHORT"
            elif rsi < 45 and bb_position < 0.4 and volume_score > 50:
                direction = "LONG"
            elif rsi > 55 and bb_position > 0.6 and volume_score > 50:
                direction = "SHORT"

            if direction:
                # Create mock signal
                highs = [c[2] for c in lookback_candles[-20:]]
                lows = [c[3] for c in lookback_candles[-20:]]
                atr = np.mean([highs[j] - lows[j] for j in range(len(highs))])

                if direction == "LONG":
                    target_price = current_price * 1.015
                    stop_loss = current_price * (1 - (atr / current_price) * 1.5)
                else:
                    target_price = current_price * 0.985
                    stop_loss = current_price * (1 + (atr / current_price) * 1.5)

                # Create temporary signal object
                class TempSignal:
                    def __init__(self):
                        self.entry_price = current_price
                        self.target_price = target_price
                        self.stop_loss = stop_loss
                        self.direction = direction

                temp_signal = TempSignal()

                # Simulate execution
                outcome = self.simulate_signal_execution(temp_signal, candles, i)
                if outcome:
                    exit_reason, exit_price, exit_time = outcome
                    entry_time = datetime.fromtimestamp(candles[i][0] / 1000)

                    # Calculate P&L
                    if direction == "LONG":
                        pnl = exit_price - current_price
                    else:
                        pnl = current_price - exit_price

                    result.add_trade(
                        entry_price=current_price,
                        exit_price=exit_price,
                        direction=direction,
                        entry_time=entry_time,
                        exit_time=exit_time,
                        reason=exit_reason,
                        pnl=pnl
                    )

        result.calculate_metrics()
        logger.info("Backtest completed: %d trades, %.2f%% win rate",
                   result.total_trades, result.win_rate * 100)
        return result


def run_backtest(
    symbol: str,
    days: int = 30,
    timeframe: str = "1h"
) -> Dict:
    """
    Run backtest for a symbol.

    Args:
        symbol: Trading pair
        days: Number of days to backtest
        timeframe: Candle timeframe

    Returns:
        Dictionary with backtest results
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    engine = BacktestEngine()
    result = engine.backtest_strategy(symbol, start_date, end_date, timeframe)

    return result.to_dict()
