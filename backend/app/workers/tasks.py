from __future__ import annotations

import logging
from datetime import datetime

import ccxt
from redis import Redis
from rq import Queue
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.signal import Signal

logger = logging.getLogger(__name__)


def _exchange() -> ccxt.Exchange:
    exchange_class = getattr(ccxt, settings.ccxt_exchange)
    exchange: ccxt.Exchange = exchange_class({"enableRateLimit": True})
    return exchange


def generate_signal_for_pair(db: Session, symbol: str) -> None:
    exchange = _exchange()
    try:
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe="1h", limit=50)
    except Exception as exc:  # pragma: no cover - network failure fallback
        logger.exception("Failed to fetch data for %s: %s", symbol, exc)
        return
    closes = [candle[4] for candle in ohlcv]
    if len(closes) < 3:
        return
    direction = "LONG" if closes[-1] > sum(closes[-3:]) / 3 else "SHORT"
    entry_price = closes[-1]
    target_price = entry_price * (1.01 if direction == "LONG" else 0.99)
    stop_loss = entry_price * (0.99 if direction == "LONG" else 1.01)

    signal = Signal(
        symbol=symbol,
        timeframe="1h",
        direction=direction,
        entry_price=entry_price,
        target_price=target_price,
        stop_loss=stop_loss,
        strategy="mean-reversion",
        created_at=datetime.utcnow(),
    )
    db.add(signal)
    db.commit()
    logger.info("Generated signal for %s", symbol)


def generate_signals() -> None:
    db = SessionLocal()
    try:
        for symbol in settings.ccxt_trading_pairs:
            generate_signal_for_pair(db, symbol)
    finally:
        db.close()


redis_conn = Redis.from_url(settings.redis_url)
queue = Queue("signals", connection=redis_conn, default_timeout=300)


def enqueue_signal_job() -> str:
    job = queue.enqueue(generate_signals)
    logger.info("Enqueued signal generation job %s", job.id)
    return job.id
