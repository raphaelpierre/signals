from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    timeframe = Column(String, nullable=False)
    direction = Column(String, nullable=False)
    entry_price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    strategy = Column(String, nullable=True)
    strategy_id = Column(String, nullable=True)  # Strategy identifier for methodology page
    confidence = Column(Float, nullable=True)  # 0-100 confidence score
    quality_score = Column(Float, nullable=True)  # 0-100 quality score
    risk_reward_ratio = Column(Float, nullable=True)
    volume_score = Column(Float, nullable=True)
    technical_indicators = Column(Text, nullable=True)  # JSON string of indicators
    rationale = Column(Text, nullable=True)  # JSON list of string rationales
    regime = Column(Text, nullable=True)  # JSON object with trend, vol, liq
    market_conditions = Column(String, nullable=True)  # bullish/bearish/neutral
    latency_ms = Column(Integer, nullable=True)  # Signal publication latency
    bt_winrate = Column(Float, nullable=True)  # Backtest win rate
    bt_pf = Column(Float, nullable=True)  # Backtest profit factor
    risk_pct = Column(Float, nullable=True, default=0.5)  # Default risk percentage
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user_signals = relationship("UserSignal", back_populates="signal")
