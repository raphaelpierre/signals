from fastapi import APIRouter

from app.api.v1 import auth, signals, stripe, user_signals, exchanges, auto_trading

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(signals.router)
api_router.include_router(stripe.router)
api_router.include_router(user_signals.router)
api_router.include_router(exchanges.router)
api_router.include_router(auto_trading.router, prefix="/auto-trading", tags=["auto-trading"])
