from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ExchangeConnectionBase(BaseModel):
    exchange_name: str = Field(..., description="Exchange name (binance, coinbase, kraken, etc.)")
    sandbox_mode: bool = Field(default=True, description="Whether to use sandbox/testnet mode")


class ExchangeConnectionCreate(ExchangeConnectionBase):
    api_key: str = Field(..., min_length=10, description="Exchange API key")
    api_secret: str = Field(..., min_length=10, description="Exchange API secret")
    api_passphrase: Optional[str] = Field(None, description="API passphrase (required for some exchanges)")


class ExchangeConnectionUpdate(BaseModel):
    is_active: Optional[bool] = None
    sandbox_mode: Optional[bool] = None


class ExchangeConnectionRead(ExchangeConnectionBase):
    id: int
    user_id: int
    is_active: bool
    last_connected: Optional[datetime]
    balance_cache: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    # Hide sensitive data
    api_key_preview: str = Field(description="Masked API key for display")
    
    class Config:
        from_attributes = True


class TradingPositionBase(BaseModel):
    symbol: str
    side: str  # buy/sell
    quantity: str
    order_type: str = Field(default="market", description="market or limit")


class TradingPositionCreate(TradingPositionBase):
    exchange_connection_id: int
    signal_id: int


class TradingPositionRead(TradingPositionBase):
    id: int
    user_id: int
    exchange_connection_id: int
    signal_id: int
    entry_price: Optional[str]
    current_price: Optional[str]
    order_id: Optional[str]
    order_status: str
    unrealized_pnl: Optional[str]
    realized_pnl: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ExchangeBalanceResponse(BaseModel):
    exchange_name: str
    balances: Dict[str, Dict[str, float]]  # {"BTC": {"free": 0.1, "used": 0.0, "total": 0.1}}
    timestamp: datetime


class LiveTradingRequest(BaseModel):
    signal_id: int
    exchange_connection_id: int
    position_size_percent: float = Field(default=1.0, ge=0.1, le=100.0, description="Percentage of available balance to use")
    order_type: str = Field(default="market", description="market or limit")


class TradingGuide(BaseModel):
    exchange_name: str
    steps: list[str]
    api_permissions: list[str]
    security_notes: list[str]
    sandbox_instructions: Optional[str] = None