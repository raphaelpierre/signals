from decimal import Decimal
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import ensure_active_subscription, get_current_user
from app.db.session import get_db
from app.models.signal import Signal
from app.models.user import User
from app.models.user_signal import SignalOutcome, UserSignal
from app.schemas.user_signal import (
    SignalStatsRead,
    UserSignalCreate,
    UserSignalRead,
    UserSignalUpdate,
)

router = APIRouter(prefix="/user-signals", tags=["user-signals"])


@router.post("/take", response_model=UserSignalRead)
def take_signal(
    user_signal_data: UserSignalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserSignal:
    """Mark a signal as taken by the user with entry details."""
    ensure_active_subscription(current_user)
    
    # Verify signal exists
    signal = db.query(Signal).filter(Signal.id == user_signal_data.signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Check if user already took this signal
    existing = db.query(UserSignal).filter(
        UserSignal.user_id == current_user.id,
        UserSignal.signal_id == user_signal_data.signal_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Signal already taken")
    
    user_signal = UserSignal(
        user_id=current_user.id,
        signal_id=user_signal_data.signal_id,
        action_type=user_signal_data.action_type,
        entry_price=user_signal_data.entry_price,
        quantity=user_signal_data.quantity,
        notes=user_signal_data.notes,
    )
    
    db.add(user_signal)
    db.commit()
    db.refresh(user_signal)
    
    return user_signal


@router.put("/{user_signal_id}/close", response_model=UserSignalRead)
def close_signal(
    user_signal_id: int,
    close_data: UserSignalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserSignal:
    """Close a taken signal with exit details and calculate P&L."""
    ensure_active_subscription(current_user)
    
    user_signal = db.query(UserSignal).filter(
        UserSignal.id == user_signal_id,
        UserSignal.user_id == current_user.id
    ).first()
    
    if not user_signal:
        raise HTTPException(status_code=404, detail="User signal not found")
    
    if user_signal.outcome != SignalOutcome.PENDING:
        raise HTTPException(status_code=400, detail="Signal already closed")
    
    # Calculate P&L if exit price provided
    if close_data.exit_price and user_signal.entry_price and user_signal.quantity:
        entry_price = float(user_signal.entry_price)
        exit_price = float(close_data.exit_price)
        quantity = float(user_signal.quantity)
        
        # Get the signal direction
        signal = db.query(Signal).filter(Signal.id == user_signal.signal_id).first()
        if signal:
            if signal.direction == "LONG":
                pnl_amount = (exit_price - entry_price) * quantity
            else:  # SHORT
                pnl_amount = (entry_price - exit_price) * quantity
            
            pnl_percentage = (pnl_amount / (entry_price * quantity)) * 100
            
            user_signal.pnl_amount = Decimal(str(pnl_amount))
            user_signal.pnl_percentage = pnl_percentage
            
            # Determine outcome
            if pnl_amount > 0:
                user_signal.outcome = SignalOutcome.PROFIT
            elif pnl_amount < 0:
                user_signal.outcome = SignalOutcome.LOSS
            else:
                user_signal.outcome = SignalOutcome.BREAKEVEN
    
    # Update fields
    if close_data.exit_price:
        user_signal.exit_price = close_data.exit_price
    if close_data.outcome:
        user_signal.outcome = close_data.outcome
    if close_data.notes:
        user_signal.notes = close_data.notes
    if close_data.exit_date:
        user_signal.exit_date = close_data.exit_date
    
    db.commit()
    db.refresh(user_signal)
    
    return user_signal


@router.get("/my-signals", response_model=List[UserSignalRead])
def get_my_signals(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[UserSignal]:
    """Get user's signal history."""
    ensure_active_subscription(current_user)
    
    user_signals = (
        db.query(UserSignal)
        .filter(UserSignal.user_id == current_user.id)
        .order_by(UserSignal.action_date.desc())
        .limit(min(limit, 200))
        .all()
    )
    
    return user_signals


@router.get("/stats", response_model=SignalStatsRead)
def get_signal_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SignalStatsRead:
    """Get user's signal statistics including P&L."""
    ensure_active_subscription(current_user)
    
    # Total signals generated (all signals in the system)
    total_signals_given = db.query(Signal).count()
    
    # User's taken signals
    user_signals = db.query(UserSignal).filter(UserSignal.user_id == current_user.id)
    signals_taken = user_signals.count()
    signals_closed = user_signals.filter(UserSignal.outcome != SignalOutcome.PENDING).count()
    
    # P&L calculations
    closed_signals = user_signals.filter(
        UserSignal.outcome != SignalOutcome.PENDING,
        UserSignal.pnl_amount.isnot(None)
    ).all()
    
    total_pnl = sum(float(signal.pnl_amount or 0) for signal in closed_signals)
    profitable_trades = len([s for s in closed_signals if (s.pnl_amount or 0) > 0])
    losing_trades = len([s for s in closed_signals if (s.pnl_amount or 0) < 0])
    
    # Calculate averages
    avg_pnl_percentage = 0.0
    win_rate = 0.0
    
    if closed_signals:
        pnl_percentages = [float(s.pnl_percentage or 0) for s in closed_signals if s.pnl_percentage is not None]
        avg_pnl_percentage = sum(pnl_percentages) / len(pnl_percentages) if pnl_percentages else 0.0
        win_rate = (profitable_trades / len(closed_signals)) * 100
    
    return SignalStatsRead(
        total_signals_given=total_signals_given,
        signals_taken=signals_taken,
        signals_closed=signals_closed,
        total_pnl=Decimal(str(total_pnl)),
        avg_pnl_percentage=avg_pnl_percentage,
        win_rate=win_rate,
        profitable_trades=profitable_trades,
        losing_trades=losing_trades,
    )