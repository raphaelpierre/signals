from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class SignalActionType(str, enum.Enum):
    TAKEN = "taken"
    IGNORED = "ignored"
    CLOSED = "closed"


class SignalOutcome(str, enum.Enum):
    PROFIT = "profit"
    LOSS = "loss"
    BREAKEVEN = "breakeven"
    PENDING = "pending"


class UserSignal(Base):
    __tablename__ = "user_signals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=False, index=True)
    action_type = Column(Enum(SignalActionType), nullable=False, default=SignalActionType.TAKEN)
    entry_price = Column(Numeric(precision=18, scale=8), nullable=True)  # Actual entry price
    exit_price = Column(Numeric(precision=18, scale=8), nullable=True)   # Actual exit price
    quantity = Column(Numeric(precision=18, scale=8), nullable=True)     # Position size
    outcome = Column(Enum(SignalOutcome), nullable=False, default=SignalOutcome.PENDING)
    pnl_amount = Column(Numeric(precision=18, scale=8), nullable=True)   # Realized P&L
    pnl_percentage = Column(Float, nullable=True)  # P&L as percentage
    notes = Column(String, nullable=True)  # User notes
    action_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    exit_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="user_signals")
    signal = relationship("Signal", back_populates="user_signals")