from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api.deps import get_current_user, ensure_active_subscription
from app.db.session import get_db
from app.models.user import User
from app.models.exchange import ExchangeConnection, TradingPosition
from app.schemas.exchange import (
    ExchangeConnectionCreate, 
    ExchangeConnectionRead, 
    ExchangeConnectionUpdate,
    ExchangeBalanceResponse,
    LiveTradingRequest,
    TradingPositionRead,
    TradingGuide
)
from app.services.exchange_service import exchange_service

router = APIRouter(prefix="/exchanges", tags=["exchanges"])


@router.get("/supported", response_model=List[str])
def get_supported_exchanges() -> List[str]:
    """Get list of supported exchanges"""
    return exchange_service.get_supported_exchanges()


@router.get("/guide/{exchange_name}", response_model=TradingGuide)
def get_setup_guide(exchange_name: str) -> TradingGuide:
    """Get step-by-step guide for setting up API keys for an exchange"""
    return exchange_service.get_trading_guide(exchange_name)


@router.post("/test-connection")
async def test_exchange_connection(
    connection_data: ExchangeConnectionCreate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Test exchange connection without saving credentials"""
    ensure_active_subscription(current_user)
    
    # Check if exchange is supported
    if connection_data.exchange_name.lower() not in exchange_service.get_supported_exchanges():
        raise HTTPException(
            status_code=400,
            detail=f"Exchange '{connection_data.exchange_name}' is not supported"
        )
    
    try:
        exchange = exchange_service.create_exchange_instance(
            connection_data.exchange_name.lower(),
            connection_data.api_key,
            connection_data.api_secret,
            connection_data.api_passphrase,
            connection_data.sandbox_mode
        )
        
        # Test connection
        test_result = await exchange_service.test_connection(exchange)
        return test_result
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to create exchange instance: {str(e)}",
            "details": str(e)
        }


@router.get("/connections", response_model=List[ExchangeConnectionRead])
def get_user_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ExchangeConnection]:
    """Get user's exchange connections"""
    ensure_active_subscription(current_user)
    
    connections = db.query(ExchangeConnection).filter(
        ExchangeConnection.user_id == current_user.id
    ).all()
    
    # Add masked API key for display
    for conn in connections:
        api_key, _, _ = exchange_service.decrypt_api_credentials(
            conn.api_key, conn.api_secret, conn.api_passphrase
        )
        conn.api_key_preview = exchange_service.mask_api_key(api_key)
    
    return connections


@router.post("/connections", response_model=ExchangeConnectionRead, status_code=status.HTTP_201_CREATED)
async def create_exchange_connection(
    connection_data: ExchangeConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ExchangeConnection:
    """Create new exchange connection"""
    ensure_active_subscription(current_user)
    
    # Check if exchange is supported
    if connection_data.exchange_name.lower() not in exchange_service.get_supported_exchanges():
        raise HTTPException(
            status_code=400,
            detail=f"Exchange '{connection_data.exchange_name}' is not supported"
        )
    
    # Check if user already has connection for this exchange
    existing = db.query(ExchangeConnection).filter(
        and_(
            ExchangeConnection.user_id == current_user.id,
            ExchangeConnection.exchange_name == connection_data.exchange_name.lower()
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Connection to {connection_data.exchange_name} already exists"
        )
    
    # Test the connection first
    try:
        exchange = exchange_service.create_exchange_instance(
            connection_data.exchange_name.lower(),
            connection_data.api_key,
            connection_data.api_secret,
            connection_data.api_passphrase,
            connection_data.sandbox_mode
        )
        
        # Test connection
        test_result = await exchange_service.test_connection(exchange)
        if not test_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to connect to {connection_data.exchange_name}: {test_result['error']}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid API credentials or exchange error: {str(e)}"
        )
    
    # Encrypt credentials
    encrypted_key, encrypted_secret, encrypted_passphrase = exchange_service.encrypt_api_credentials(
        connection_data.api_key,
        connection_data.api_secret,
        connection_data.api_passphrase
    )
    
    # Create connection
    db_connection = ExchangeConnection(
        user_id=current_user.id,
        exchange_name=connection_data.exchange_name.lower(),
        api_key=encrypted_key,
        api_secret=encrypted_secret,
        api_passphrase=encrypted_passphrase,
        sandbox_mode=connection_data.sandbox_mode,
        last_connected=datetime.utcnow()
    )
    
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    
    # Add masked API key for response
    db_connection.api_key_preview = exchange_service.mask_api_key(connection_data.api_key)
    
    return db_connection


@router.put("/connections/{connection_id}", response_model=ExchangeConnectionRead)
def update_exchange_connection(
    connection_id: int,
    update_data: ExchangeConnectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ExchangeConnection:
    """Update exchange connection settings"""
    ensure_active_subscription(current_user)
    
    connection = db.query(ExchangeConnection).filter(
        and_(
            ExchangeConnection.id == connection_id,
            ExchangeConnection.user_id == current_user.id
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Exchange connection not found")
    
    # Update fields
    if update_data.is_active is not None:
        connection.is_active = update_data.is_active
    if update_data.sandbox_mode is not None:
        connection.sandbox_mode = update_data.sandbox_mode
    
    db.commit()
    db.refresh(connection)
    
    # Add masked API key for response
    api_key, _, _ = exchange_service.decrypt_api_credentials(
        connection.api_key, connection.api_secret, connection.api_passphrase
    )
    connection.api_key_preview = exchange_service.mask_api_key(api_key)
    
    return connection


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exchange_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete exchange connection"""
    ensure_active_subscription(current_user)
    
    connection = db.query(ExchangeConnection).filter(
        and_(
            ExchangeConnection.id == connection_id,
            ExchangeConnection.user_id == current_user.id
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Exchange connection not found")
    
    # Check for active trading positions
    active_positions = db.query(TradingPosition).filter(
        and_(
            TradingPosition.exchange_connection_id == connection_id,
            TradingPosition.status == "active"
        )
    ).count()
    
    if active_positions > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete connection with active trading positions"
        )
    
    db.delete(connection)
    db.commit()


@router.get("/connections/{connection_id}/balances", response_model=ExchangeBalanceResponse)
async def get_exchange_balances(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ExchangeBalanceResponse:
    """Get balances for a specific exchange connection"""
    ensure_active_subscription(current_user)
    
    connection = db.query(ExchangeConnection).filter(
        and_(
            ExchangeConnection.id == connection_id,
            ExchangeConnection.user_id == current_user.id,
            ExchangeConnection.is_active == True
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Active exchange connection not found")
    
    # Decrypt credentials and create exchange instance
    api_key, api_secret, api_passphrase = exchange_service.decrypt_api_credentials(
        connection.api_key, connection.api_secret, connection.api_passphrase
    )
    
    exchange = exchange_service.create_exchange_instance(
        connection.exchange_name,
        api_key,
        api_secret,
        api_passphrase,
        connection.sandbox_mode
    )
    
    try:
        balances = await exchange_service.fetch_balances(exchange)
        
        # Cache the balances
        connection.balance_cache = balances.model_dump_json()
        connection.last_connected = datetime.utcnow()
        db.commit()
        
        return balances
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch balances: {str(e)}"
        )


@router.post("/trade", response_model=TradingPositionRead, status_code=status.HTTP_201_CREATED)
def execute_live_trade(
    trade_request: LiveTradingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> TradingPosition:
    """Execute a live trade based on a signal"""
    ensure_active_subscription(current_user)
    
    # Get exchange connection
    connection = db.query(ExchangeConnection).filter(
        and_(
            ExchangeConnection.id == trade_request.exchange_connection_id,
            ExchangeConnection.user_id == current_user.id,
            ExchangeConnection.is_active == True
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Active exchange connection not found")
    
    # Get signal
    from app.models.signal import Signal
    signal = db.query(Signal).filter(Signal.id == trade_request.signal_id).first()
    if not signal or not signal.is_active:
        raise HTTPException(status_code=404, detail="Active signal not found")
    
    # TODO: Implement actual trading logic here
    # This would include:
    # 1. Calculate position size based on available balance and percentage
    # 2. Create exchange instance
    # 3. Place market/limit order
    # 4. Store order details in TradingPosition
    
    # For now, create a placeholder position
    position = TradingPosition(
        user_id=current_user.id,
        exchange_connection_id=connection.id,
        signal_id=signal.id,
        symbol=signal.symbol,
        side="buy" if signal.direction == "LONG" else "sell",
        quantity="0",  # Would be calculated based on position_size_percent
        order_type=trade_request.order_type,
        order_status="pending",
        status="active"
    )
    
    db.add(position)
    db.commit()
    db.refresh(position)
    
    return position


@router.get("/positions", response_model=List[TradingPositionRead])
def get_trading_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[TradingPosition]:
    """Get user's trading positions"""
    ensure_active_subscription(current_user)
    
    positions = db.query(TradingPosition).filter(
        TradingPosition.user_id == current_user.id
    ).order_by(TradingPosition.created_at.desc()).all()
    
    return positions