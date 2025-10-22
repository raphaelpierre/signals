"""
Notification Service for Trading Signals

Handles real-time notifications via WebSocket and email notifications for trading signals.
"""

import json
import logging
from typing import Optional, List
from datetime import datetime
import asyncio

from redis import Redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.signal import Signal
from app.models.user import User

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing signal notifications."""

    def __init__(self):
        """Initialize notification service."""
        self.redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
        self.notification_channel = "signal_notifications"

    def publish_signal_notification(self, signal: Signal) -> bool:
        """
        Publish signal notification to Redis pub/sub channel.

        This allows the WebSocket service to pick up and broadcast to connected clients.
        """
        try:
            signal_data = {
                "id": signal.id,
                "symbol": signal.symbol,
                "direction": signal.direction,
                "entry_price": float(signal.entry_price),
                "target_price": float(signal.target_price),
                "stop_loss": float(signal.stop_loss),
                "confidence": float(signal.confidence),
                "risk_reward_ratio": float(signal.risk_reward_ratio) if signal.risk_reward_ratio else None,
                "strategy": signal.strategy,
                "created_at": signal.created_at.isoformat() if signal.created_at else None,
                "expires_at": signal.expires_at.isoformat() if signal.expires_at else None,
                "rationale": json.loads(signal.rationale) if signal.rationale else []
            }

            message = {
                "type": "new_signal",
                "data": signal_data,
                "timestamp": datetime.utcnow().isoformat()
            }

            # Publish to Redis pub/sub channel
            self.redis_client.publish(
                self.notification_channel,
                json.dumps(message)
            )

            logger.info(f"Published signal notification for {signal.symbol} to Redis channel")
            return True

        except Exception as e:
            logger.error(f"Failed to publish signal notification: {e}")
            return False

    def queue_email_notification(
        self,
        user_email: str,
        signal: Signal,
        db: Session
    ) -> bool:
        """
        Queue email notification for a user about a new signal.

        In production, this would use a proper email service like SendGrid, SES, etc.
        """
        try:
            # Store email notification in Redis queue for processing
            notification_data = {
                "email": user_email,
                "subject": f"New {signal.direction} Signal: {signal.symbol}",
                "signal_id": signal.id,
                "symbol": signal.symbol,
                "direction": signal.direction,
                "entry_price": float(signal.entry_price),
                "target_price": float(signal.target_price),
                "stop_loss": float(signal.stop_loss),
                "confidence": float(signal.confidence),
                "created_at": datetime.utcnow().isoformat()
            }

            # Push to email queue
            self.redis_client.lpush(
                "email_notifications",
                json.dumps(notification_data)
            )

            logger.info(f"Queued email notification for {user_email} about {signal.symbol}")
            return True

        except Exception as e:
            logger.error(f"Failed to queue email notification: {e}")
            return False

    def notify_users_about_signal(
        self,
        signal: Signal,
        db: Session,
        email_enabled: bool = False
    ) -> dict:
        """
        Notify all subscribed users about a new signal.

        Args:
            signal: The Signal object to notify about
            db: Database session
            email_enabled: Whether to send email notifications

        Returns:
            dict with notification statistics
        """
        stats = {
            "websocket_published": False,
            "emails_queued": 0,
            "errors": 0
        }

        # Publish to WebSocket channel
        if self.publish_signal_notification(signal):
            stats["websocket_published"] = True

        # Queue email notifications for subscribed users (if enabled)
        if email_enabled:
            try:
                # Get all active users with subscriptions
                # In a real system, you'd have user preferences for notification settings
                from app.models.subscription import Subscription

                active_users = db.query(User).join(Subscription).filter(
                    Subscription.status == "active",
                    User.is_active == True
                ).all()

                for user in active_users:
                    if user.email:
                        if self.queue_email_notification(user.email, signal, db):
                            stats["emails_queued"] += 1
                        else:
                            stats["errors"] += 1

            except Exception as e:
                logger.error(f"Failed to queue email notifications: {e}")
                stats["errors"] += 1

        return stats


# Singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Get or create notification service instance."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service


def notify_new_signal_sync(signal: Signal) -> bool:
    """
    Synchronous wrapper to notify about new signal.

    Use this from synchronous contexts (like RQ workers).
    """
    try:
        notification_service = get_notification_service()
        stats = notification_service.notify_users_about_signal(
            signal,
            db=None,  # We don't have DB access in sync context
            email_enabled=False  # Disable email for now
        )
        logger.info(f"Signal notification stats: {stats}")
        return stats["websocket_published"]
    except Exception as e:
        logger.error(f"Failed to send signal notification: {e}")
        return False


async def notify_new_signal_async(signal: Signal, db: Session) -> dict:
    """
    Asynchronous wrapper to notify about new signal.

    Use this from async contexts (like API endpoints).
    """
    try:
        notification_service = get_notification_service()
        stats = notification_service.notify_users_about_signal(
            signal,
            db=db,
            email_enabled=True
        )
        return stats
    except Exception as e:
        logger.error(f"Failed to send signal notification: {e}")
        return {"error": str(e)}


def send_signal_email(
    recipient_email: str,
    signal_data: dict
) -> bool:
    """
    Send email notification about a signal.

    This is a placeholder. In production, integrate with:
    - SendGrid
    - Amazon SES
    - Mailgun
    - Postmark
    """
    # TODO: Implement actual email sending
    logger.info(f"[EMAIL] Would send to {recipient_email}: {signal_data['subject']}")
    logger.info(f"[EMAIL] Signal: {signal_data['symbol']} {signal_data['direction']} @ {signal_data['entry_price']}")

    # Placeholder: In production, you would do something like:
    # import sendgrid
    # sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
    # ...

    return True


class EmailWorker:
    """Background worker for processing email notifications."""

    def __init__(self):
        """Initialize email worker."""
        self.redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_name = "email_notifications"

    def process_email_queue(self, max_batch: int = 10) -> int:
        """
        Process pending email notifications from queue.

        Args:
            max_batch: Maximum number of emails to process in one batch

        Returns:
            Number of emails processed
        """
        processed = 0

        try:
            for _ in range(max_batch):
                # Pop email notification from queue
                notification_json = self.redis_client.rpop(self.queue_name)

                if not notification_json:
                    break

                notification_data = json.loads(notification_json)

                # Send email
                if send_signal_email(
                    notification_data["email"],
                    notification_data
                ):
                    processed += 1
                    logger.info(f"Processed email notification for {notification_data['email']}")
                else:
                    logger.error(f"Failed to send email to {notification_data['email']}")
                    # Re-queue failed emails (with retry limit in production)
                    self.redis_client.lpush(self.queue_name, notification_json)

        except Exception as e:
            logger.error(f"Error processing email queue: {e}")

        return processed

    def run_forever(self, poll_interval: int = 5):
        """
        Run email worker in a loop.

        Args:
            poll_interval: Seconds to wait between queue checks
        """
        logger.info("Starting email notification worker...")

        import time
        while True:
            try:
                processed = self.process_email_queue()
                if processed > 0:
                    logger.info(f"Processed {processed} email notifications")

                time.sleep(poll_interval)

            except KeyboardInterrupt:
                logger.info("Email worker stopped by user")
                break
            except Exception as e:
                logger.error(f"Email worker error: {e}")
                time.sleep(poll_interval)


# WebSocket integration functions

async def start_websocket_subscriber():
    """
    Start a WebSocket subscriber that listens to Redis pub/sub channel
    and broadcasts to connected WebSocket clients.

    This should be run as a background task in the FastAPI application.
    """
    from app.api.v1.websocket import get_connection_manager

    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    pubsub = redis_client.pubsub()
    pubsub.subscribe("signal_notifications")

    manager = get_connection_manager()

    logger.info("Started WebSocket subscriber for signal notifications")

    try:
        for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    notification = json.loads(message["data"])
                    signal_data = notification.get("data", {})

                    # Broadcast to all connected users subscribed to this symbol
                    await manager.broadcast_signal(signal_data)

                    logger.debug(f"Broadcasted signal {signal_data.get('symbol')} to WebSocket clients")

                except Exception as e:
                    logger.error(f"Error broadcasting WebSocket message: {e}")

    except Exception as e:
        logger.error(f"WebSocket subscriber error: {e}")
    finally:
        pubsub.close()
