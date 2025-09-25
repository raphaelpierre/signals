from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import ensure_active_subscription, get_current_user
from app.db.session import get_db
from app.models.signal import Signal
from app.models.user import User
from app.schemas.signal import SignalRead
from app.workers.tasks import enqueue_signal_job

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("/latest", response_model=list[SignalRead])
def get_latest_signals(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Signal]:
    ensure_active_subscription(current_user)
    signals = (
        db.query(Signal)
        .order_by(Signal.created_at.desc())
        .limit(min(limit, 100))
        .all()
    )
    return signals


@router.get("/watchlist", response_model=list[SignalRead])
def get_signals_for_pairs(
    symbols: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Signal]:
    ensure_active_subscription(current_user)
    tickers = {symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip()}
    if not tickers:
        return []
    signals = (
        db.query(Signal)
        .filter(Signal.symbol.in_(tickers))
        .order_by(Signal.created_at.desc())
        .limit(100)
        .all()
    )
    return signals


@router.post("/refresh")
def refresh_signals(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    ensure_active_subscription(current_user)
    job_id = enqueue_signal_job()
    return {"job_id": job_id}
