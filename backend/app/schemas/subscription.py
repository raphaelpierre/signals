from datetime import datetime
from typing import Union

from pydantic import BaseModel


class SubscriptionRead(BaseModel):
    status: str
    stripe_subscription_id: Union[str, None] = None
    current_period_end: Union[datetime, None] = None

    class Config:
        from_attributes = True
