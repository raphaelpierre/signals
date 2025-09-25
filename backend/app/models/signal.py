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
    confidence = Column(Float, nullable=True)  # 0-100 confidence score
    risk_reward_ratio = Column(Float, nullable=True)
    volume_score = Column(Float, nullable=True)
    technical_indicators = Column(Text, nullable=True)  # JSON string of indicators
    market_conditions = Column(String, nullable=True)  # bullish/bearish/neutral
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user_signals = relationship("UserSignal", back_populates="signal")
