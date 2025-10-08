"""Backtest API endpoints."""
import logging
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from typing import Dict

from app.api.deps import ensure_active_subscription, get_current_user
from app.models.user import User
from app.services.backtest_service import run_backtest
from app.core.rate_limit import rate_limit_by_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/backtest", tags=["backtest"])


@router.post("/run")
async def run_backtest_endpoint(
    symbol: str = Query(description="Trading pair to backtest"),
    days: int = Query(default=30, le=90, description="Number of days to backtest"),
    timeframe: str = Query(default="1h", description="Candle timeframe"),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """
    Run backtest for a trading strategy.

    This is a resource-intensive operation, so it's rate-limited
    and can be run in the background.
    """
    ensure_active_subscription(current_user)

    # Apply rate limit for expensive backtest operation
    await rate_limit_by_user(current_user.id, "backtest", limit=3, window=3600)  # 3 per hour

    logger.info("Starting backtest for %s by user %d", symbol, current_user.id)

    # Run backtest synchronously for now
    # In production, this should be queued as a background job
    result = run_backtest(symbol, days, timeframe)

    return {
        "status": "completed",
        "symbol": symbol,
        "period_days": days,
        "timeframe": timeframe,
        "results": result
    }


@router.get("/example")
def get_example_backtest(
    current_user: User = Depends(get_current_user),
) -> Dict:
    """
    Get example backtest results to demonstrate the feature.

    Returns pre-computed results without running actual backtest.
    """
    ensure_active_subscription(current_user)

    # Return example results
    return {
        "status": "completed",
        "symbol": "BTC/USDT",
        "period_days": 30,
        "timeframe": "1h",
        "results": {
            "total_trades": 42,
            "winning_trades": 25,
            "losing_trades": 17,
            "win_rate": 59.52,
            "profit_factor": 1.85,
            "total_profit": 8500.0,
            "total_loss": 4595.0,
            "net_profit": 3905.0,
            "avg_win": 340.0,
            "avg_loss": 270.29,
            "largest_win": 1250.0,
            "largest_loss": 850.0,
            "max_drawdown": 1850.0,
            "sharpe_ratio": 1.42,
            "max_consecutive_wins": 6,
            "max_consecutive_losses": 4,
            "trades": []
        }
    }
