from datetime import datetime
from decimal import Decimal
from typing import Optional, Union

from pydantic import BaseModel, Field

from app.models.user_signal import SignalActionType, SignalOutcome


class UserSignalBase(BaseModel):
    action_type: SignalActionType = SignalActionType.TAKEN
    entry_price: Optional[Decimal] = None
    exit_price: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    outcome: SignalOutcome = SignalOutcome.PENDING
    pnl_amount: Optional[Decimal] = None
    pnl_percentage: Optional[float] = None
    notes: Optional[str] = None


class UserSignalCreate(UserSignalBase):
    signal_id: int
    entry_price: Decimal = Field(..., description="Actual entry price")
    quantity: Decimal = Field(..., description="Position size")


class UserSignalUpdate(BaseModel):
    exit_price: Optional[Decimal] = None
    outcome: Optional[SignalOutcome] = None
    pnl_amount: Optional[Decimal] = None
    pnl_percentage: Optional[float] = None
    notes: Optional[str] = None
    exit_date: Optional[datetime] = None


class UserSignalRead(UserSignalBase):
    id: int
    user_id: int
    signal_id: int
    action_date: datetime
    exit_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SignalStatsRead(BaseModel):
    total_signals_given: int
    signals_taken: int
    signals_closed: int
    total_pnl: Decimal
    avg_pnl_percentage: float
    win_rate: float
    profitable_trades: int
    losing_trades: int