from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.api.deps import get_current_user, get_db
from app.core.security import ensure_active_subscription
from app.models.user import User
from app.models.auto_trading import AutoTradingConfig, AutoTrade, PortfolioAllocation, CryptoWatchlist
from app.models.exchange import ExchangeConnection
from app.models.signal import Signal
from app.schemas.auto_trading import (
    AutoTradingConfigCreate,
    AutoTradingConfigRead,
    AutoTradingConfigUpdate,
    AutoTradeRead,
    PortfolioAllocationCreate,
    PortfolioAllocationRead,
    PortfolioAllocationUpdate,
    CryptoWatchlistCreate,
    CryptoWatchlistRead,
    CryptoWatchlistUpdate,
    PortfolioAnalytics,
    InvestmentRecommendation
)

router = APIRouter()


@router.post("/config", response_model=AutoTradingConfigRead, status_code=status.HTTP_201_CREATED)
def create_auto_trading_config(
    config_data: AutoTradingConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AutoTradingConfig:
    """Create a new auto trading configuration"""
    ensure_active_subscription(current_user)
    
    # Verify exchange connection belongs to user
    connection = db.query(ExchangeConnection).filter(
        and_(
            ExchangeConnection.id == config_data.exchange_connection_id,
            ExchangeConnection.user_id == current_user.id,
            ExchangeConnection.is_active == True
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Exchange connection not found")
    
    # Check if config already exists for this exchange
    existing_config = db.query(AutoTradingConfig).filter(
        and_(
            AutoTradingConfig.user_id == current_user.id,
            AutoTradingConfig.exchange_connection_id == config_data.exchange_connection_id
        )
    ).first()
    
    if existing_config:
        raise HTTPException(status_code=400, detail="Auto trading config already exists for this exchange")
    
    # Convert lists to JSON strings
    config_dict = config_data.dict()
    if config_dict.get("allowed_symbols"):
        config_dict["allowed_symbols"] = json.dumps(config_dict["allowed_symbols"])
    if config_dict.get("blocked_symbols"):
        config_dict["blocked_symbols"] = json.dumps(config_dict["blocked_symbols"])
    if config_dict.get("allowed_strategies"):
        config_dict["allowed_strategies"] = json.dumps(config_dict["allowed_strategies"])
    if config_dict.get("target_allocations"):
        config_dict["target_allocations"] = json.dumps(config_dict["target_allocations"])
    
    config = AutoTradingConfig(
        user_id=current_user.id,
        **config_dict
    )
    
    db.add(config)
    db.commit()
    db.refresh(config)
    
    return config


@router.get("/config", response_model=List[AutoTradingConfigRead])
def get_auto_trading_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[AutoTradingConfig]:
    """Get user's auto trading configurations"""
    ensure_active_subscription(current_user)
    
    configs = db.query(AutoTradingConfig).filter(
        AutoTradingConfig.user_id == current_user.id
    ).all()
    
    return configs


@router.get("/config/{config_id}", response_model=AutoTradingConfigRead)
def get_auto_trading_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AutoTradingConfig:
    """Get specific auto trading configuration"""
    ensure_active_subscription(current_user)
    
    config = db.query(AutoTradingConfig).filter(
        and_(
            AutoTradingConfig.id == config_id,
            AutoTradingConfig.user_id == current_user.id
        )
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Auto trading config not found")
    
    return config


@router.put("/config/{config_id}", response_model=AutoTradingConfigRead)
def update_auto_trading_config(
    config_id: int,
    config_update: AutoTradingConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AutoTradingConfig:
    """Update auto trading configuration"""
    ensure_active_subscription(current_user)
    
    config = db.query(AutoTradingConfig).filter(
        and_(
            AutoTradingConfig.id == config_id,
            AutoTradingConfig.user_id == current_user.id
        )
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Auto trading config not found")
    
    update_data = config_update.dict(exclude_unset=True)
    
    # Convert lists to JSON strings
    if "allowed_symbols" in update_data and update_data["allowed_symbols"] is not None:
        update_data["allowed_symbols"] = json.dumps(update_data["allowed_symbols"])
    if "blocked_symbols" in update_data and update_data["blocked_symbols"] is not None:
        update_data["blocked_symbols"] = json.dumps(update_data["blocked_symbols"])
    if "allowed_strategies" in update_data and update_data["allowed_strategies"] is not None:
        update_data["allowed_strategies"] = json.dumps(update_data["allowed_strategies"])
    if "target_allocations" in update_data and update_data["target_allocations"] is not None:
        update_data["target_allocations"] = json.dumps(update_data["target_allocations"])
    
    for field, value in update_data.items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return config


@router.delete("/config/{config_id}")
def delete_auto_trading_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete auto trading configuration"""
    ensure_active_subscription(current_user)
    
    config = db.query(AutoTradingConfig).filter(
        and_(
            AutoTradingConfig.id == config_id,
            AutoTradingConfig.user_id == current_user.id
        )
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Auto trading config not found")
    
    db.delete(config)
    db.commit()
    
    return {"message": "Auto trading config deleted successfully"}


@router.get("/trades", response_model=List[AutoTradeRead])
def get_auto_trades(
    config_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[AutoTrade]:
    """Get user's auto trades"""
    ensure_active_subscription(current_user)
    
    query = db.query(AutoTrade).join(AutoTradingConfig).filter(
        AutoTradingConfig.user_id == current_user.id
    )
    
    if config_id:
        query = query.filter(AutoTrade.config_id == config_id)
    
    trades = query.order_by(AutoTrade.created_at.desc()).limit(limit).all()
    
    return trades


@router.post("/portfolio", response_model=PortfolioAllocationRead, status_code=status.HTTP_201_CREATED)
def create_portfolio_allocation(
    allocation_data: PortfolioAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PortfolioAllocation:
    """Create or update portfolio allocation"""
    ensure_active_subscription(current_user)
    
    # Check if allocation already exists for this symbol
    existing_allocation = db.query(PortfolioAllocation).filter(
        and_(
            PortfolioAllocation.user_id == current_user.id,
            PortfolioAllocation.symbol == allocation_data.symbol
        )
    ).first()
    
    if existing_allocation:
        # Update existing allocation
        for field, value in allocation_data.dict().items():
            setattr(existing_allocation, field, value)
        
        db.commit()
        db.refresh(existing_allocation)
        return existing_allocation
    
    # Create new allocation
    allocation = PortfolioAllocation(
        user_id=current_user.id,
        **allocation_data.dict()
    )
    
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    
    return allocation


@router.get("/portfolio", response_model=List[PortfolioAllocationRead])
def get_portfolio_allocations(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[PortfolioAllocation]:
    """Get user's portfolio allocations"""
    ensure_active_subscription(current_user)
    
    query = db.query(PortfolioAllocation).filter(
        PortfolioAllocation.user_id == current_user.id
    )
    
    if active_only:
        query = query.filter(PortfolioAllocation.is_active == True)
    
    allocations = query.order_by(PortfolioAllocation.target_percentage.desc()).all()
    
    return allocations


@router.put("/portfolio/{allocation_id}", response_model=PortfolioAllocationRead)
def update_portfolio_allocation(
    allocation_id: int,
    allocation_update: PortfolioAllocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PortfolioAllocation:
    """Update portfolio allocation"""
    ensure_active_subscription(current_user)
    
    allocation = db.query(PortfolioAllocation).filter(
        and_(
            PortfolioAllocation.id == allocation_id,
            PortfolioAllocation.user_id == current_user.id
        )
    ).first()
    
    if not allocation:
        raise HTTPException(status_code=404, detail="Portfolio allocation not found")
    
    update_data = allocation_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(allocation, field, value)
    
    db.commit()
    db.refresh(allocation)
    
    return allocation


@router.delete("/portfolio/{allocation_id}")
def delete_portfolio_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete portfolio allocation"""
    ensure_active_subscription(current_user)
    
    allocation = db.query(PortfolioAllocation).filter(
        and_(
            PortfolioAllocation.id == allocation_id,
            PortfolioAllocation.user_id == current_user.id
        )
    ).first()
    
    if not allocation:
        raise HTTPException(status_code=404, detail="Portfolio allocation not found")
    
    db.delete(allocation)
    db.commit()
    
    return {"message": "Portfolio allocation deleted successfully"}


@router.get("/portfolio/analytics", response_model=PortfolioAnalytics)
def get_portfolio_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PortfolioAnalytics:
    """Get portfolio analytics and performance data"""
    ensure_active_subscription(current_user)
    
    allocations = db.query(PortfolioAllocation).filter(
        and_(
            PortfolioAllocation.user_id == current_user.id,
            PortfolioAllocation.is_active == True
        )
    ).all()
    
    total_allocated = sum(allocation.target_percentage for allocation in allocations)
    unallocated = max(0, 100 - total_allocated)
    
    # Mock performance data (in real implementation, would fetch from exchange/price API)
    analytics = PortfolioAnalytics(
        total_value_usd=10000.0,  # Mock value
        total_allocated_percentage=total_allocated,
        unallocated_percentage=unallocated,
        rebalance_needed=total_allocated > 100 or unallocated > 5,
        next_rebalance_date=None,
        allocations=allocations,
        performance_24h=2.5,  # Mock performance
        performance_7d=7.8,
        performance_30d=15.2
    )
    
    return analytics


@router.post("/watchlist", response_model=CryptoWatchlistRead, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    watchlist_data: CryptoWatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> CryptoWatchlist:
    """Add crypto to watchlist"""
    ensure_active_subscription(current_user)
    
    # Check if already in watchlist
    existing = db.query(CryptoWatchlist).filter(
        and_(
            CryptoWatchlist.user_id == current_user.id,
            CryptoWatchlist.symbol == watchlist_data.symbol
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Symbol already in watchlist")
    
    watchlist_item = CryptoWatchlist(
        user_id=current_user.id,
        **watchlist_data.dict()
    )
    
    db.add(watchlist_item)
    db.commit()
    db.refresh(watchlist_item)
    
    return watchlist_item


@router.get("/watchlist", response_model=List[CryptoWatchlistRead])
def get_watchlist(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[CryptoWatchlist]:
    """Get user's crypto watchlist"""
    ensure_active_subscription(current_user)
    
    query = db.query(CryptoWatchlist).filter(
        CryptoWatchlist.user_id == current_user.id
    )
    
    if active_only:
        query = query.filter(CryptoWatchlist.is_active == True)
    
    watchlist = query.order_by(CryptoWatchlist.priority.asc(), CryptoWatchlist.symbol.asc()).all()
    
    return watchlist


@router.put("/watchlist/{item_id}", response_model=CryptoWatchlistRead)
def update_watchlist_item(
    item_id: int,
    item_update: CryptoWatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> CryptoWatchlist:
    """Update watchlist item"""
    ensure_active_subscription(current_user)
    
    item = db.query(CryptoWatchlist).filter(
        and_(
            CryptoWatchlist.id == item_id,
            CryptoWatchlist.user_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/watchlist/{item_id}")
def remove_from_watchlist(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove crypto from watchlist"""
    ensure_active_subscription(current_user)
    
    item = db.query(CryptoWatchlist).filter(
        and_(
            CryptoWatchlist.id == item_id,
            CryptoWatchlist.user_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item removed from watchlist"}


@router.get("/recommendations", response_model=List[InvestmentRecommendation])
def get_investment_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[InvestmentRecommendation]:
    """Get AI-powered investment recommendations based on signals and portfolio"""
    ensure_active_subscription(current_user)
    
    # Get user's current portfolio
    allocations = db.query(PortfolioAllocation).filter(
        and_(
            PortfolioAllocation.user_id == current_user.id,
            PortfolioAllocation.is_active == True
        )
    ).all()
    
    # Get recent high-confidence signals
    recent_signals = db.query(Signal).filter(
        and_(
            Signal.is_active == True,
            Signal.confidence >= 75.0
        )
    ).order_by(Signal.created_at.desc()).limit(10).all()
    
    # Generate mock recommendations (in real implementation, would use ML models)
    recommendations = []
    
    for signal in recent_signals[:5]:
        current_allocation = next(
            (alloc for alloc in allocations if alloc.symbol == signal.symbol),
            None
        )
        current_percentage = current_allocation.current_percentage if current_allocation else 0.0
        
        if signal.direction == "LONG" and signal.confidence > 80:
            recommended_percentage = min(15.0, current_percentage + 5.0)
            action = "buy" if recommended_percentage > current_percentage else "hold"
        else:
            recommended_percentage = max(0.0, current_percentage - 2.0)
            action = "sell" if recommended_percentage < current_percentage else "hold"
        
        recommendations.append(InvestmentRecommendation(
            symbol=signal.symbol,
            action=action,
            recommended_percentage=recommended_percentage,
            current_percentage=current_percentage,
            reason=f"High confidence {signal.direction.lower()} signal with {signal.confidence:.1f}% confidence",
            confidence=signal.confidence / 100.0,
            risk_level="medium" if signal.confidence > 85 else "high"
        ))
    
    return recommendations