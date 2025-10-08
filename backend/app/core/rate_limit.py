"""Rate limiting middleware and utilities."""
import logging
import time
from typing import Optional
from fastapi import Request, HTTPException, status
from redis import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Redis-backed rate limiter."""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def check_rate_limit(
        self,
        key: str,
        limit: int,
        window: int,
        identifier: str = "request"
    ) -> tuple[bool, dict]:
        """
        Check if rate limit is exceeded.

        Args:
            key: Unique identifier for the rate limit bucket
            limit: Maximum number of requests allowed
            window: Time window in seconds
            identifier: Description of what's being limited

        Returns:
            (is_allowed, info_dict) tuple
        """
        now = time.time()
        window_key = f"ratelimit:{key}:{int(now / window)}"

        try:
            current = self.redis.incr(window_key)
            if current == 1:
                self.redis.expire(window_key, window)

            remaining = max(0, limit - current)
            reset_time = int((int(now / window) + 1) * window)

            info = {
                "limit": limit,
                "remaining": remaining,
                "reset": reset_time,
                "retry_after": reset_time - int(now) if current > limit else None
            }

            if current > limit:
                logger.warning(
                    "Rate limit exceeded for %s: %d/%d in %ds window",
                    key, current, limit, window
                )
                return False, info

            return True, info

        except Exception as exc:
            logger.error("Rate limit check failed for %s: %s", key, exc)
            # Fail open - allow request if Redis is down
            return True, {"limit": limit, "remaining": limit, "reset": int(now + window)}


def get_rate_limiter() -> RateLimiter:
    """Get rate limiter instance."""
    from app.workers.tasks import redis_conn
    return RateLimiter(redis_conn)


async def rate_limit_by_ip(
    request: Request,
    limit: int = 100,
    window: int = 60
) -> dict:
    """
    Rate limit by IP address.

    Args:
        request: FastAPI request object
        limit: Max requests per window
        window: Time window in seconds

    Returns:
        Rate limit info dict

    Raises:
        HTTPException: If rate limit exceeded
    """
    client_ip = request.client.host if request.client else "unknown"
    limiter = get_rate_limiter()

    allowed, info = limiter.check_rate_limit(
        f"ip:{client_ip}",
        limit,
        window,
        "IP"
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": info["limit"],
                "retry_after": info["retry_after"]
            },
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset"]),
                "Retry-After": str(info["retry_after"])
            }
        )

    return info


async def rate_limit_by_user(
    user_id: int,
    endpoint: str,
    limit: int = 60,
    window: int = 60
) -> dict:
    """
    Rate limit by user ID and endpoint.

    Args:
        user_id: User ID
        endpoint: Endpoint identifier
        limit: Max requests per window
        window: Time window in seconds

    Returns:
        Rate limit info dict

    Raises:
        HTTPException: If rate limit exceeded
    """
    limiter = get_rate_limiter()

    allowed, info = limiter.check_rate_limit(
        f"user:{user_id}:{endpoint}",
        limit,
        window,
        f"User {user_id} on {endpoint}"
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": info["limit"],
                "retry_after": info["retry_after"]
            },
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset"]),
                "Retry-After": str(info["retry_after"])
            }
        )

    return info
