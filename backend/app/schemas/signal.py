from datetime import datetime

from pydantic import BaseModel


class SignalBase(BaseModel):
    symbol: str
    timeframe: str
    direction: str
    entry_price: float
    target_price: float
    stop_loss: float
    strategy: str | None = None


class SignalRead(SignalBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
