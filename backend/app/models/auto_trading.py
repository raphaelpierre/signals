from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class AutoTradingConfig(Base):
    __tablename__ = "auto_trading_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exchange_connection_id = Column(Integer, ForeignKey("exchange_connections.id"), nullable=False)
    
    # Configuration settings
    is_enabled = Column(Boolean, default=False, nullable=False)
    trading_mode = Column(String, nullable=False, default="signals_only")  # signals_only, copy_trading, portfolio_following
    
    # Risk management
    max_position_size_percent = Column(Float, nullable=False, default=5.0)  # Max % of portfolio per trade
    max_daily_trades = Column(Integer, nullable=False, default=5)
    max_open_positions = Column(Integer, nullable=False, default=3)
    stop_loss_enabled = Column(Boolean, default=True, nullable=False)
    take_profit_enabled = Column(Boolean, default=True, nullable=False)
    
    # Signal filtering
    min_confidence_score = Column(Float, nullable=False, default=70.0)
    allowed_symbols = Column(Text, nullable=True)  # JSON list of trading pairs
    blocked_symbols = Column(Text, nullable=True)  # JSON list of blocked pairs
    allowed_strategies = Column(Text, nullable=True)  # JSON list of strategy names
    
    # Investment settings
    follow_portfolio_allocation = Column(Boolean, default=False, nullable=False)
    rebalance_frequency = Column(String, nullable=False, default="weekly")  # daily, weekly, monthly
    target_allocations = Column(Text, nullable=True)  # JSON mapping of symbol to target %
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_trade_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    exchange_connection = relationship("ExchangeConnection")
    auto_trades = relationship("AutoTrade", back_populates="config")


class AutoTrade(Base):
    __tablename__ = "auto_trades"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("auto_trading_configs.id"), nullable=False)
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=False)
    trading_position_id = Column(Integer, ForeignKey("trading_positions.id"), nullable=True)
    
    # Trade details
    symbol = Column(String, nullable=False)
    action = Column(String, nullable=False)  # open, close, modify
    trigger_reason = Column(String, nullable=False)  # signal_match, stop_loss, take_profit, rebalance
    
    # Execution details
    executed = Column(Boolean, default=False, nullable=False)
    execution_price = Column(String, nullable=True)
    quantity = Column(String, nullable=False)
    
    # Metadata
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    executed_at = Column(DateTime, nullable=True)
    
    # Relationships
    config = relationship("AutoTradingConfig", back_populates="auto_trades")
    signal = relationship("Signal")
    trading_position = relationship("TradingPosition")


class PortfolioAllocation(Base):
    __tablename__ = "portfolio_allocations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Allocation details
    symbol = Column(String, nullable=False, index=True)
    target_percentage = Column(Float, nullable=False)  # Target allocation percentage
    current_percentage = Column(Float, nullable=True)  # Current allocation percentage
    
    # Investment settings
    min_investment_amount = Column(Float, nullable=False, default=25.0)  # Minimum USDT to invest
    auto_rebalance = Column(Boolean, default=True, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_rebalanced_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")


class CryptoWatchlist(Base):
    __tablename__ = "crypto_watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Crypto details
    symbol = Column(String, nullable=False, index=True)
    priority = Column(Integer, nullable=False, default=1)  # 1=high, 2=medium, 3=low
    auto_trade_enabled = Column(Boolean, default=False, nullable=False)
    
    # Alert settings
    price_alerts_enabled = Column(Boolean, default=False, nullable=False)
    price_alert_above = Column(Float, nullable=True)
    price_alert_below = Column(Float, nullable=True)
    volume_alert_enabled = Column(Boolean, default=False, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")