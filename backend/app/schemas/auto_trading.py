from datetime import datetime
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field


# Auto Trading Config Schemas
class AutoTradingConfigBase(BaseModel):
    is_enabled: bool = False
    trading_mode: str = "signals_only"
    max_position_size_percent: float = Field(default=5.0, ge=0.1, le=50.0)
    max_daily_trades: int = Field(default=5, ge=1, le=50)
    max_open_positions: int = Field(default=3, ge=1, le=20)
    stop_loss_enabled: bool = True
    take_profit_enabled: bool = True
    min_confidence_score: float = Field(default=70.0, ge=0.0, le=100.0)
    allowed_symbols: Optional[List[str]] = None
    blocked_symbols: Optional[List[str]] = None
    allowed_strategies: Optional[List[str]] = None
    follow_portfolio_allocation: bool = False
    rebalance_frequency: str = "weekly"
    target_allocations: Optional[Dict[str, float]] = None


class AutoTradingConfigCreate(AutoTradingConfigBase):
    exchange_connection_id: int


class AutoTradingConfigUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    trading_mode: Optional[str] = None
    max_position_size_percent: Optional[float] = None
    max_daily_trades: Optional[int] = None
    max_open_positions: Optional[int] = None
    stop_loss_enabled: Optional[bool] = None
    take_profit_enabled: Optional[bool] = None
    min_confidence_score: Optional[float] = None
    allowed_symbols: Optional[List[str]] = None
    blocked_symbols: Optional[List[str]] = None
    allowed_strategies: Optional[List[str]] = None
    follow_portfolio_allocation: Optional[bool] = None
    rebalance_frequency: Optional[str] = None
    target_allocations: Optional[Dict[str, float]] = None


class AutoTradingConfigRead(AutoTradingConfigBase):
    id: int
    user_id: int
    exchange_connection_id: int
    created_at: datetime
    updated_at: datetime
    last_trade_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Auto Trade Schemas
class AutoTradeBase(BaseModel):
    symbol: str
    action: str
    trigger_reason: str
    quantity: str


class AutoTradeCreate(AutoTradeBase):
    config_id: int
    signal_id: int


class AutoTradeRead(AutoTradeBase):
    id: int
    config_id: int
    signal_id: int
    trading_position_id: Optional[int]
    executed: bool
    execution_price: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    executed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Portfolio Allocation Schemas
class PortfolioAllocationBase(BaseModel):
    symbol: str
    target_percentage: float = Field(ge=0.0, le=100.0)
    min_investment_amount: float = Field(default=25.0, ge=1.0)
    auto_rebalance: bool = True


class PortfolioAllocationCreate(PortfolioAllocationBase):
    pass


class PortfolioAllocationUpdate(BaseModel):
    target_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    min_investment_amount: Optional[float] = Field(None, ge=1.0)
    auto_rebalance: Optional[bool] = None
    is_active: Optional[bool] = None


class PortfolioAllocationRead(PortfolioAllocationBase):
    id: int
    user_id: int
    current_percentage: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_rebalanced_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Crypto Watchlist Schemas
class CryptoWatchlistBase(BaseModel):
    symbol: str
    priority: int = Field(default=1, ge=1, le=3)
    auto_trade_enabled: bool = False
    price_alerts_enabled: bool = False
    price_alert_above: Optional[float] = None
    price_alert_below: Optional[float] = None
    volume_alert_enabled: bool = False


class CryptoWatchlistCreate(CryptoWatchlistBase):
    pass


class CryptoWatchlistUpdate(BaseModel):
    priority: Optional[int] = Field(None, ge=1, le=3)
    auto_trade_enabled: Optional[bool] = None
    price_alerts_enabled: Optional[bool] = None
    price_alert_above: Optional[float] = None
    price_alert_below: Optional[float] = None
    volume_alert_enabled: Optional[bool] = None
    is_active: Optional[bool] = None


class CryptoWatchlistRead(CryptoWatchlistBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Portfolio Analytics Schema
class PortfolioAnalytics(BaseModel):
    total_value_usd: float
    total_allocated_percentage: float
    unallocated_percentage: float
    rebalance_needed: bool
    next_rebalance_date: Optional[datetime]
    allocations: List[PortfolioAllocationRead]
    performance_24h: float
    performance_7d: float
    performance_30d: float


# Investment Recommendation Schema
class InvestmentRecommendation(BaseModel):
    symbol: str
    action: str  # buy, sell, hold
    recommended_percentage: float
    current_percentage: float
    reason: str
    confidence: float
    risk_level: str  # low, medium, high