"""WebSocket endpoints for real-time updates."""
import json
import logging
import asyncio
from typing import Dict, Set
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_ws
from app.db.session import get_db
from app.models.signal import Signal
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.symbol_subscriptions: Dict[str, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and register a new connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")

    def subscribe_to_symbol(self, user_id: int, symbol: str):
        """Subscribe user to symbol updates."""
        if symbol not in self.symbol_subscriptions:
            self.symbol_subscriptions[symbol] = set()
        self.symbol_subscriptions[symbol].add(user_id)
        logger.info(f"User {user_id} subscribed to {symbol}")

    def unsubscribe_from_symbol(self, user_id: int, symbol: str):
        """Unsubscribe user from symbol updates."""
        if symbol in self.symbol_subscriptions:
            self.symbol_subscriptions[symbol].discard(user_id)
            if not self.symbol_subscriptions[symbol]:
                del self.symbol_subscriptions[symbol]
        logger.info(f"User {user_id} unsubscribed from {symbol}")

    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user."""
        if user_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(websocket)

            # Clean up disconnected websockets
            for ws in disconnected:
                self.disconnect(ws, user_id)

    async def broadcast_signal(self, signal_data: dict):
        """Broadcast new signal to subscribed users."""
        symbol = signal_data.get("symbol")
        if symbol and symbol in self.symbol_subscriptions:
            message = {
                "type": "new_signal",
                "data": signal_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            for user_id in self.symbol_subscriptions[symbol]:
                await self.send_personal_message(message, user_id)

    async def broadcast_price_update(self, symbol: str, price: float, change_pct: float):
        """Broadcast price update to subscribed users."""
        if symbol in self.symbol_subscriptions:
            message = {
                "type": "price_update",
                "data": {
                    "symbol": symbol,
                    "price": price,
                    "change_pct": change_pct
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            for user_id in self.symbol_subscriptions[symbol]:
                await self.send_personal_message(message, user_id)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time updates.

    Client sends:
    - {"action": "subscribe", "symbol": "BTC/USDT"} to subscribe to symbol
    - {"action": "unsubscribe", "symbol": "BTC/USDT"} to unsubscribe
    - {"action": "ping"} for keepalive

    Server sends:
    - {"type": "new_signal", "data": {...}} when new signal is generated
    - {"type": "price_update", "data": {...}} when price updates
    - {"type": "pong"} in response to ping
    - {"type": "error", "message": "..."} on errors
    """
    user = None
    try:
        # Authenticate user
        user = await get_current_user_ws(token, db)
        if not user:
            await websocket.close(code=1008, reason="Authentication failed")
            return

        await manager.connect(websocket, user.id)

        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connection established",
            "user_id": user.id
        })

        # Listen for messages
        while True:
            try:
                data = await websocket.receive_json()
                action = data.get("action")

                if action == "subscribe":
                    symbol = data.get("symbol")
                    if symbol:
                        manager.subscribe_to_symbol(user.id, symbol)
                        await websocket.send_json({
                            "type": "subscribed",
                            "symbol": symbol
                        })

                elif action == "unsubscribe":
                    symbol = data.get("symbol")
                    if symbol:
                        manager.unsubscribe_from_symbol(user.id, symbol)
                        await websocket.send_json({
                            "type": "unsubscribed",
                            "symbol": symbol
                        })

                elif action == "ping":
                    await websocket.send_json({"type": "pong"})

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown action: {action}"
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })

    except WebSocketDisconnect:
        if user:
            manager.disconnect(websocket, user.id)
            logger.info(f"User {user.id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user:
            manager.disconnect(websocket, user.id)
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass


async def notify_new_signal(signal: Signal):
    """
    Notify connected clients about new signal.

    Call this function when a new signal is generated.
    """
    signal_data = {
        "id": signal.id,
        "symbol": signal.symbol,
        "direction": signal.direction,
        "entry_price": signal.entry_price,
        "target_price": signal.target_price,
        "stop_loss": signal.stop_loss,
        "confidence": signal.confidence,
        "created_at": signal.created_at.isoformat() if signal.created_at else None
    }
    await manager.broadcast_signal(signal_data)


async def notify_price_update(symbol: str, price: float, change_pct: float):
    """
    Notify connected clients about price updates.

    Call this function when price data is updated.
    """
    await manager.broadcast_price_update(symbol, price, change_pct)


def get_connection_manager() -> ConnectionManager:
    """Get the global connection manager instance."""
    return manager
