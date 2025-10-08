from typing import List
import logging
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Dict, Iterable, List, Optional, Sequence

import ccxt
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.api.deps import ensure_active_subscription, get_current_user
from app.core.config import settings
from app.core.cache import get_cache, invalidate_signals_cache
from app.core.exceptions import ExchangeAPIError, RateLimitError
from app.core.rate_limit import rate_limit_by_ip, rate_limit_by_user
from app.db.session import get_db
from app.models.signal import Signal
from app.models.user import User
from app.schemas.signal import SignalAnalytics, SignalRead
from app.workers.tasks import enqueue_signal_job

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/signals", tags=["signals"])


@lru_cache(maxsize=1)
def _exchange() -> ccxt.Exchange:
    exchange_class = getattr(ccxt, settings.ccxt_exchange)
    exchange: ccxt.Exchange = exchange_class({"enableRateLimit": True})
    try:
        exchange.load_markets()
    except Exception as exc:  # pragma: no cover - external API failures
        logger.warning("Failed to pre-load markets: %s", exc)
    return exchange


def _fetch_live_market_data(symbols: Iterable[str], retry_count: int = 2, use_cache: bool = True) -> Dict[str, Dict[str, Optional[float]]]:
    unique_symbols = sorted({symbol for symbol in symbols if symbol})
    if not unique_symbols:
        return {}

    # Check cache first
    cache = get_cache()
    cache_key = f"market_data:bulk:{','.join(unique_symbols)}"

    if use_cache:
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug("Cache hit for market data: %d symbols", len(unique_symbols))
            return cached_data

    exchange = _exchange()
    tickers = {}

    for attempt in range(retry_count):
        try:
            tickers = exchange.fetch_tickers(unique_symbols)
            break
        except ccxt.RateLimitExceeded as exc:
            logger.warning("Rate limit on bulk ticker fetch, attempt %d/%d", attempt + 1, retry_count)
            if attempt < retry_count - 1:
                import time
                time.sleep(2 ** attempt)
            else:
                logger.error("Rate limit exceeded after %d attempts", retry_count)
        except ccxt.NetworkError as exc:
            logger.warning("Network error on bulk ticker fetch: %s, attempt %d/%d", exc, attempt + 1, retry_count)
            if attempt < retry_count - 1:
                import time
                time.sleep(1)
        except Exception as exc:
            logger.warning("Bulk ticker fetch failed: %s", exc)
            break

    market_data: Dict[str, Dict[str, Optional[float]]] = {}

    for symbol in unique_symbols:
        ticker = tickers.get(symbol)
        if ticker is None:
            # Fallback to individual ticker fetch with retry
            for attempt in range(retry_count):
                try:
                    ticker = exchange.fetch_ticker(symbol)
                    break
                except ccxt.RateLimitExceeded:
                    if attempt < retry_count - 1:
                        import time
                        time.sleep(1)
                    else:
                        logger.warning("Rate limit fetching ticker for %s", symbol)
                        continue
                except (ccxt.NetworkError, ccxt.ExchangeError) as exc:
                    logger.warning("Failed to fetch ticker for %s: %s", symbol, exc)
                    break
                except Exception as exc:
                    logger.error("Unexpected error fetching ticker for %s: %s", symbol, exc)
                    break

        if ticker:
            last_price = ticker.get("last") or ticker.get("close")
            if last_price is not None:
                market_data[symbol] = {
                    "price": float(last_price),
                    "percentage": float(ticker.get("percentage")) if ticker.get("percentage") is not None else None,
                }

    # Cache the result for 30 seconds (market data changes frequently)
    if market_data and use_cache:
        cache.set(cache_key, market_data, ttl=30)

    return market_data


def _attach_live_market_data(signals: Sequence[Signal]) -> List[SignalRead]:
    if not signals:
        return []

    market_data = _fetch_live_market_data(signal.symbol for signal in signals)
    fetched_at = datetime.utcnow()

    enriched: List[SignalRead] = []
    for signal in signals:
        signal_schema = SignalRead.model_validate(signal)
        if market_data:
            data = market_data.get(signal.symbol)
            if data:
                signal_schema = signal_schema.model_copy(update={
                    "current_price": data.get("price"),
                    "price_change_percent": data.get("percentage"),
                    "price_last_updated": fetched_at,
                })
        enriched.append(signal_schema)

    return enriched


def _deactivate_expired_signals(db: Session) -> None:
    """Mark signals as inactive once their expiration has passed."""
    now = datetime.utcnow()
    expired = (
        db.query(Signal)
        .filter(
            Signal.is_active == True,  # noqa: E712 - SQLAlchemy comparison
            Signal.expires_at.isnot(None),
            Signal.expires_at <= now,
        )
        .update({Signal.is_active: False}, synchronize_session=False)
    )

    if expired:
        db.commit()


@router.get("/historic", response_model=List[SignalRead])
async def get_historic_signals(
    request: Request,
    days: int = Query(default=30, le=90, description="Number of days of history to show"),
    limit: int = Query(default=50, le=200, description="Maximum number of signals to return"),
    symbol: str = Query(default=None, description="Filter by specific trading pair"),
    db: Session = Depends(get_db),
    rate_limit_info: dict = Depends(lambda r: rate_limit_by_ip(r, limit=100, window=60)),
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
    return _attach_live_market_data(signals)


@router.get("/demo", response_model=List[SignalRead])
async def get_demo_signals(
    request: Request,
    db: Session = Depends(get_db),
    rate_limit_info: dict = Depends(lambda r: rate_limit_by_ip(r, limit=100, window=60)),
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

    return _attach_live_market_data(signals)


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
            "period_days": days,
            "total_signals": 0,
            "avg_confidence": 0,
            "avg_risk_reward": 0,
            "high_confidence_signals": 0,
            "high_confidence_percentage": 0,
            "direction_distribution": {"long": 0, "short": 0, "long_percentage": 0, "short_percentage": 0},
            "confidence_distribution": {"high": 0, "medium": 0, "low": 0},
            "top_symbols": []
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

    # Build cache key based on query parameters
    cache_key = f"signals:latest:{limit}:{symbol or 'all'}:{direction or 'all'}:{min_confidence or 'none'}"
    cache = get_cache()

    # Check cache (short TTL since signals are time-sensitive)
    cached = cache.get(cache_key)
    if cached:
        logger.debug("Cache hit for latest signals")
        return cached

    _deactivate_expired_signals(db)

    now = datetime.utcnow()

    query = db.query(Signal).filter(Signal.is_active == True)
    query = query.filter(or_(Signal.expires_at.is_(None), Signal.expires_at > now))

    if symbol:
        query = query.filter(Signal.symbol == symbol.upper())

    if direction:
        query = query.filter(Signal.direction == direction.upper())

    if min_confidence is not None:
        query = query.filter(Signal.confidence >= min_confidence)

    signals = query.order_by(Signal.created_at.desc()).limit(limit).all()
    result = _attach_live_market_data(signals)

    # Cache for 60 seconds
    cache.set(cache_key, result, ttl=60)

    return result


@router.get("/watchlist", response_model=List[SignalRead])
def get_signals_for_pairs(
    symbols: str = Query(description="Comma-separated list of trading pairs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Signal]:
    ensure_active_subscription(current_user)
    _deactivate_expired_signals(db)
    now = datetime.utcnow()
    tickers = {symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip()}
    if not tickers:
        return []
    signals = (
        db.query(Signal)
        .filter(Signal.symbol.in_(tickers))
        .filter(Signal.is_active == True)
        .filter(or_(Signal.expires_at.is_(None), Signal.expires_at > now))
        .order_by(Signal.created_at.desc())
        .limit(100)
        .all()
    )
    return _attach_live_market_data(signals)


@router.get("/analytics", response_model=SignalAnalytics)
def get_signal_analytics(
    days: int = Query(default=7, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SignalAnalytics:
    ensure_active_subscription(current_user)

    _deactivate_expired_signals(db)
    now = datetime.utcnow()
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Basic counts
    total_signals = db.query(Signal).filter(Signal.created_at >= cutoff_date).count()
    active_signals = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.is_active == True,
        or_(Signal.expires_at.is_(None), Signal.expires_at > now)
    ).count()

    # Direction counts
    long_signals = db.query(Signal).filter(
        Signal.created_at >= cutoff_date,
        Signal.direction == "LONG"
    ).count()
    short_signals = total_signals - long_signals
    
    # Average metrics
    avg_confidence = db.query(func.avg(Signal.confidence)).filter(
        Signal.created_at >= cutoff_date,
        Signal.confidence.isnot(None)
    ).scalar() or 0
    
    avg_risk_reward = db.query(func.avg(Signal.risk_reward_ratio)).filter(
        Signal.created_at >= cutoff_date,
        Signal.risk_reward_ratio.isnot(None)
    ).scalar() or 0
    
    # Top performing pairs
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

    _deactivate_expired_signals(db)
    now = datetime.utcnow()

    signals = (
        db.query(Signal)
        .filter(Signal.is_active == True)
        .filter(or_(Signal.expires_at.is_(None), Signal.expires_at > now))
        .filter(Signal.confidence >= min_confidence)
        .order_by(Signal.confidence.desc())
        .limit(limit)
        .all()
    )
    return _attach_live_market_data(signals)


@router.post("/refresh")
async def refresh_signals(
    current_user: User = Depends(get_current_user),
    rate_limit_info: dict = Depends(lambda: None)
) -> dict:
    ensure_active_subscription(current_user)

    # Apply stricter rate limit for expensive signal refresh operation
    await rate_limit_by_user(current_user.id, "refresh", limit=5, window=300)  # 5 per 5 minutes

    job_id = enqueue_signal_job()
    return {
        "job_id": job_id,
        "message": "Signal generation job queued successfully",
        "estimated_completion": "2-3 minutes"
    }