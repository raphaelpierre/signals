#!/usr/bin/env python3
"""
Script to populate historic signals for demonstration purposes.
This script generates realistic historic signals with proper confidence scores and risk-reward ratios.
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta
import random
from typing import List

# Add the app directory to the Python path
sys.path.append('/Users/raphaelpierre/Development/signals/backend')

from app.db.session import async_session
from app.models.signal import Signal
from sqlalchemy import select

# Trading pairs we support
TRADING_PAIRS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT",
    "MATICUSDT", "DOTUSDT", "AVAXUSDT", "LINKUSDT", "UNIUSDT"
]

# Sample price data for realistic signal generation
SAMPLE_PRICES = {
    "BTCUSDT": {"base": 43000, "range": 8000},
    "ETHUSDT": {"base": 2500, "range": 500},
    "BNBUSDT": {"base": 320, "range": 60},
    "ADAUSDT": {"base": 0.45, "range": 0.15},
    "SOLUSDT": {"base": 85, "range": 25},
    "MATICUSDT": {"base": 0.85, "range": 0.25},
    "DOTUSDT": {"base": 7.5, "range": 2.0},
    "AVAXUSDT": {"base": 28, "range": 8},
    "LINKUSDT": {"base": 14, "range": 4},
    "UNIUSDT": {"base": 6.5, "range": 2.0}
}

STRATEGIES = [
    "RSI Oversold + Volume Spike",
    "Bollinger Band Squeeze Breakout", 
    "MACD Golden Cross",
    "Support/Resistance Bounce",
    "Volume Profile Reversal",
    "Multi-Timeframe Confluence",
    "Mean Reversion Signal",
    "Momentum Breakout"
]

def generate_realistic_signal_data(symbol: str, days_ago: int) -> dict:
    """Generate realistic signal data for a given symbol and time."""
    price_info = SAMPLE_PRICES[symbol]
    base_price = price_info["base"]
    price_range = price_info["range"]
    
    # Generate a realistic entry price
    entry_price = base_price + random.uniform(-price_range/2, price_range/2)
    
    # Determine direction (60% long bias in demo data)
    direction = "LONG" if random.random() < 0.6 else "SHORT"
    
    # Generate confidence (bias toward higher confidence for demo)
    if days_ago < 7:  # Recent signals have varied confidence
        confidence = random.uniform(55, 95)
    else:  # Historic demo signals are higher quality
        confidence = random.uniform(70, 95)
    
    # Calculate target and stop loss based on direction and confidence
    risk_percentage = random.uniform(1.5, 4.0)  # 1.5-4% risk
    reward_multiplier = random.uniform(1.2, 3.5)  # 1.2-3.5x reward
    
    if direction == "LONG":
        stop_loss = entry_price * (1 - risk_percentage / 100)
        target_price = entry_price * (1 + (risk_percentage * reward_multiplier) / 100)
    else:
        stop_loss = entry_price * (1 + risk_percentage / 100)
        target_price = entry_price * (1 - (risk_percentage * reward_multiplier) / 100)
    
    risk_reward_ratio = abs((target_price - entry_price) / (entry_price - stop_loss))
    
    # Generate volume score based on confidence
    volume_score = confidence + random.uniform(-15, 10)
    volume_score = max(0, min(100, volume_score))
    
    # Generate technical indicators JSON
    technical_indicators = {
        "rsi_14": random.uniform(20, 80),
        "macd_signal": "bullish" if direction == "LONG" else "bearish",
        "bb_position": random.choice(["lower_band", "middle", "upper_band"]),
        "volume_sma_ratio": random.uniform(0.8, 2.5),
        "atr_14": random.uniform(1.5, 4.0)
    }
    
    # Generate market conditions
    market_conditions = random.choice([
        "trending_up", "trending_down", "sideways", "volatile", 
        "low_volume", "high_volume", "consolidating"
    ])
    
    # Create timestamp
    created_at = datetime.utcnow() - timedelta(days=days_ago, 
                                             hours=random.randint(0, 23),
                                             minutes=random.randint(0, 59))
    
    # Signals expire after 24-48 hours typically
    expires_at = created_at + timedelta(hours=random.randint(24, 48))
    
    return {
        "symbol": symbol,
        "timeframe": random.choice(["1h", "4h", "1d"]),
        "direction": direction,
        "entry_price": round(entry_price, 4 if entry_price < 10 else 2),
        "target_price": round(target_price, 4 if target_price < 10 else 2),
        "stop_loss": round(stop_loss, 4 if stop_loss < 10 else 2),
        "strategy": random.choice(STRATEGIES),
        "confidence": round(confidence, 1),
        "risk_reward_ratio": round(risk_reward_ratio, 2),
        "volume_score": round(volume_score, 1),
        "technical_indicators": technical_indicators,
        "market_conditions": market_conditions,
        "is_active": created_at > datetime.utcnow() - timedelta(hours=48),  # Only recent signals are active
        "expires_at": expires_at,
        "created_at": created_at
    }

async def populate_historic_signals(num_signals: int = 150):
    """Populate the database with historic signals."""
    print(f"Generating {num_signals} historic signals...")
    
    async with async_session() as db:
        # Check if we already have signals
        result = await db.execute(select(Signal))
        existing_signals = result.scalars().all()
        
        if len(existing_signals) >= num_signals:
            print(f"Already have {len(existing_signals)} signals. Skipping generation.")
            return
        
        signals_to_create = []
        
        # Generate signals over the past 90 days
        for i in range(num_signals):
            # Distribute signals across time (more recent = fewer signals)
            if i < num_signals * 0.3:  # 30% in last 7 days
                days_ago = random.randint(0, 7)
            elif i < num_signals * 0.6:  # 30% in 8-30 days
                days_ago = random.randint(8, 30)
            else:  # 40% in 31-90 days
                days_ago = random.randint(31, 90)
            
            symbol = random.choice(TRADING_PAIRS)
            signal_data = generate_realistic_signal_data(symbol, days_ago)
            
            signal = Signal(**signal_data)
            signals_to_create.append(signal)
        
        # Sort by creation date
        signals_to_create.sort(key=lambda x: x.created_at)
        
        # Bulk insert
        db.add_all(signals_to_create)
        await db.commit()
        
        print(f"Successfully created {len(signals_to_create)} historic signals!")
        
        # Print some statistics
        long_signals = len([s for s in signals_to_create if s.direction == "LONG"])
        short_signals = len(signals_to_create) - long_signals
        avg_confidence = sum(s.confidence for s in signals_to_create) / len(signals_to_create)
        avg_rr = sum(s.risk_reward_ratio for s in signals_to_create) / len(signals_to_create)
        
        print(f"Statistics:")
        print(f"  Long signals: {long_signals} ({long_signals/len(signals_to_create)*100:.1f}%)")
        print(f"  Short signals: {short_signals} ({short_signals/len(signals_to_create)*100:.1f}%)")
        print(f"  Average confidence: {avg_confidence:.1f}%")
        print(f"  Average R/R ratio: {avg_rr:.2f}")
        
        # Show distribution by symbol
        print(f"Distribution by symbol:")
        symbol_counts = {}
        for signal in signals_to_create:
            symbol_counts[signal.symbol] = symbol_counts.get(signal.symbol, 0) + 1
        
        for symbol, count in sorted(symbol_counts.items()):
            print(f"  {symbol}: {count} signals")

if __name__ == "__main__":
    asyncio.run(populate_historic_signals())