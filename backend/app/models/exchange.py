from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


class ExchangeConnection(Base):
    __tablename__ = "exchange_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exchange_name = Column(String, nullable=False)  # binance, coinbase, kraken, etc.
    api_key = Column(Text, nullable=False)  # Encrypted
    api_secret = Column(Text, nullable=False)  # Encrypted
    api_passphrase = Column(Text, nullable=True)  # For exchanges like Coinbase Pro
    sandbox_mode = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_connected = Column(DateTime, nullable=True)
    balance_cache = Column(Text, nullable=True)  # JSON string of cached balances
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="exchange_connections")
    trading_positions = relationship("TradingPosition", back_populates="exchange_connection")


class TradingPosition(Base):
    __tablename__ = "trading_positions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exchange_connection_id = Column(Integer, ForeignKey("exchange_connections.id"), nullable=False)
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=False)
    
    # Position details
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # buy/sell
    quantity = Column(String, nullable=False)  # Use string to avoid precision issues
    entry_price = Column(String, nullable=True)
    current_price = Column(String, nullable=True)
    
    # Order details
    order_id = Column(String, nullable=True)  # Exchange order ID
    order_status = Column(String, nullable=False, default="pending")  # pending, filled, cancelled, failed
    order_type = Column(String, nullable=False, default="market")  # market, limit
    
    # PnL tracking
    unrealized_pnl = Column(String, nullable=True)
    realized_pnl = Column(String, nullable=True)
    
    # Status and metadata
    status = Column(String, nullable=False, default="active")  # active, closed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
    exchange_connection = relationship("ExchangeConnection", back_populates="trading_positions")
    signal = relationship("Signal")