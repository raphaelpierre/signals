from datetime import datetime
from typing import Union

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    is_active: bool
    stripe_customer_id: Union[str, None] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
