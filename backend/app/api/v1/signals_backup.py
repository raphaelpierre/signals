from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.api.deps import ensure_active_subscription, get_current_user
from app.db.session import get_db
from app.models.signal import Signal
from app.models.user import User
from app.schemas.signal import SignalRead, SignalAnalytics
from app.workers.tasks import enqueue_signal_job

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("/historic", response_model=List[SignalRead])
def get_historic_signals(
    days: int = Query(default=30, le=90, description="Number of days of history to show"),
    limit: int = Query(default=50, le=200, description="Maximum number of signals to return"),
    symbol: str = Query(default=None, description="Filter by specific trading pair"),
    db: Session = Depends(get_db),
) -> List[Signal]:
    """
    Public endpoint for historic signals - no authentication required.
    Shows past signals for prospects to evaluate system performance.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.created_at <= datetime.utcnow() - timedelta(hours=24)  # Only show signals older than 24h
    )
    
    if symbol:
        query = query.filter(Signal.symbol == symbol.upper())
    
    # Order by confidence descending to show best signals first
    signals = query.order_by(Signal.confidence.desc(), Signal.created_at.desc()).limit(limit).all()
    return signals


@router.get("/demo", response_model=List[SignalRead])
def get_demo_signals(
    db: Session = Depends(get_db),
) -> List[Signal]:
    """
    Public endpoint for demo signals - shows a curated selection of high-quality historic signals.
    Perfect for landing pages and prospect demonstrations.
    """
    # Get the best performing signals from the last 60 days
    cutoff_date = datetime.utcnow() - timedelta(days=60)
    
    signals = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.created_at <= datetime.utcnow() - timedelta(hours=24),
        Signal.confidence >= 75,  # Only high-confidence signals
        Signal.risk_reward_ratio >= 1.5  # Only good R/R ratios
    ).order_by(
        Signal.confidence.desc()
    ).limit(10).all()
    
    return signals


@router.get("/performance-showcase", response_model=dict)
def get_performance_showcase(
    days: int = Query(default=30, le=90),
    db: Session = Depends(get_db),
) -> dict:
    """
    Public endpoint showing aggregated performance metrics for marketing/prospects.
    No authentication required - shows system performance overview.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all signals in the time period (excluding last 24h to allow for completion)
    signals_query = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.created_at <= datetime.utcnow() - timedelta(hours=24)
    )
    
    total_signals = signals_query.count()
    
    if total_signals == 0:
        return {
            "total_signals": 0,
            "avg_confidence": 0,
            "avg_risk_reward": 0,
            "high_confidence_signals": 0,
            "top_symbols": [],
            "direction_distribution": {"long": 0, "short": 0},
            "confidence_distribution": {"high": 0, "medium": 0, "low": 0}
        }
    
    # Calculate metrics
    confidence_avg = db.query(func.avg(Signal.confidence)).filter(
        Signal.created_at >= cutoff_date,
        Signal.created_at <= datetime.utcnow() - timedelta(hours=24),
        Signal.confidence.isnot(None)
    ).scalar() or 0
    
    rr_avg = db.query(func.avg(Signal.risk_reward_ratio)).filter(
        Signal.created_at >= cutoff_date,
        Signal.created_at <= datetime.utcnow() - timedelta(hours=24),
        Signal.risk_reward_ratio.isnot(None)
    ).scalar() or 0
    
    high_confidence_count = signals_query.filter(Signal.confidence >= 80).count()
    
    # Direction distribution
    long_count = signals_query.filter(Signal.direction == "LONG").count()
    short_count = signals_query.filter(Signal.direction == "SHORT").count()
    
    # Confidence distribution
    high_conf = signals_query.filter(Signal.confidence >= 80).count()
    medium_conf = signals_query.filter(Signal.confidence >= 60, Signal.confidence < 80).count()
    low_conf = signals_query.filter(Signal.confidence < 60).count()
    
    # Top symbols by signal count
    top_symbols = db.query(
        Signal.symbol,
        func.count(Signal.id).label('count'),
        func.avg(Signal.confidence).label('avg_conf')
    ).filter(
        Signal.created_at >= cutoff_date,
        Signal.created_at <= datetime.utcnow() - timedelta(hours=24)
    ).group_by(Signal.symbol).order_by(desc('count')).limit(5).all()
    
    return {
        "period_days": days,
        "total_signals": total_signals,
        "avg_confidence": round(confidence_avg, 1),
        "avg_risk_reward": round(rr_avg, 2),
        "high_confidence_signals": high_confidence_count,
        "high_confidence_percentage": round((high_confidence_count / total_signals * 100), 1) if total_signals > 0 else 0,
        "direction_distribution": {
            "long": long_count,
            "short": short_count,
            "long_percentage": round((long_count / total_signals * 100), 1) if total_signals > 0 else 0,
            "short_percentage": round((short_count / total_signals * 100), 1) if total_signals > 0 else 0
        },
        "confidence_distribution": {
            "high": high_conf,
            "medium": medium_conf,
            "low": low_conf
        },
        "top_symbols": [
            {
                "symbol": symbol.symbol,
                "signal_count": symbol.count,
                "avg_confidence": round(symbol.avg_conf, 1)
            }
            for symbol in top_symbols
        ]
    }


@router.get("/latest", response_model=List[SignalRead])
def get_latest_signals(
    limit: int = Query(default=20, le=100),
    symbol: str = Query(default=None, description="Filter by specific trading pair"),
    direction: str = Query(default=None, description="Filter by LONG or SHORT"),
    min_confidence: float = Query(default=None, description="Minimum confidence score"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Signal]:
    ensure_active_subscription(current_user)
    
    query = db.query(Signal).filter(Signal.is_active == True)
    
    if symbol:
        query = query.filter(Signal.symbol == symbol.upper())
    
    if direction:
        query = query.filter(Signal.direction == direction.upper())
    
    if min_confidence is not None:
        query = query.filter(Signal.confidence >= min_confidence)
    
    signals = query.order_by(Signal.created_at.desc()).limit(limit).all()
    return signals


@router.get("/watchlist", response_model=List[SignalRead])
def get_signals_for_pairs(
    symbols: str = Query(description="Comma-separated list of trading pairs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Signal]:
    ensure_active_subscription(current_user)
    tickers = {symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip()}
    if not tickers:
        return []
    signals = (
        db.query(Signal)
        .filter(Signal.symbol.in_(tickers))
        .filter(Signal.is_active == True)
        .order_by(Signal.created_at.desc())
        .limit(100)
        .all()
    )
    return signals


@router.get("/analytics", response_model=SignalAnalytics)
def get_signal_analytics(
    days: int = Query(default=7, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SignalAnalytics:
    ensure_active_subscription(current_user)
    
    from datetime import datetime, timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Basic counts
    total_signals = db.query(Signal).filter(Signal.created_at >= cutoff_date).count()
    active_signals = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.is_active == True
    ).count()
    
    long_signals = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.direction == "LONG"
    ).count()
    
    short_signals = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.direction == "SHORT"
    ).count()
    
    # Average metrics
    avg_confidence = db.query(func.avg(Signal.confidence)).filter(
        Signal.created_at >= cutoff_date,
        Signal.confidence.isnot(None)
    ).scalar() or 0.0
    
    avg_risk_reward = db.query(func.avg(Signal.risk_reward_ratio)).filter(
        Signal.created_at >= cutoff_date,
        Signal.risk_reward_ratio.isnot(None)
    ).scalar() or 0.0
    
    # Top performing pairs (by signal count)
    top_pairs = db.query(
        Signal.symbol,
        func.count(Signal.id).label('signal_count'),
        func.avg(Signal.confidence).label('avg_confidence')
    ).filter(
        Signal.created_at >= cutoff_date
    ).group_by(
        Signal.symbol
    ).order_by(
        desc('signal_count')
    ).limit(5).all()
    
    top_performing_pairs = [
        {
            "symbol": pair.symbol,
            "signal_count": pair.signal_count,
            "avg_confidence": round(pair.avg_confidence or 0, 1)
        }
        for pair in top_pairs
    ]
    
    return SignalAnalytics(
        total_signals=total_signals,
        active_signals=active_signals,
        long_signals=long_signals,
        short_signals=short_signals,
        avg_confidence=round(avg_confidence, 1),
        avg_risk_reward=round(avg_risk_reward, 2),
        top_performing_pairs=top_performing_pairs
    )


@router.get("/high-confidence", response_model=List[SignalRead])
def get_high_confidence_signals(
    min_confidence: float = Query(default=80, description="Minimum confidence threshold"),
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Signal]:
    ensure_active_subscription(current_user)
    
    signals = (
        db.query(Signal)
        .filter(Signal.is_active == True)
        .filter(Signal.confidence >= min_confidence)
        .order_by(Signal.confidence.desc())
        .limit(limit)
        .all()
    )
    return signals


@router.post("/refresh")
def refresh_signals(current_user: User = Depends(get_current_user)) -> dict:
    ensure_active_subscription(current_user)
    job_id = enqueue_signal_job()
    return {
        "job_id": job_id,
        "message": "Signal generation job queued successfully",
        "estimated_completion": "2-3 minutes"
    }
