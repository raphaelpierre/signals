from datetime import datetime

from pydantic import BaseModel


class SubscriptionRead(BaseModel):
    status: str
    stripe_subscription_id: str | None = None
    current_period_end: datetime | None = None

    class Config:
        from_attributes = True
