"""Caching utilities using Redis."""
import json
import logging
from typing import Any, Optional, Callable
from functools import wraps
from redis import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class Cache:
    """Redis-backed cache manager."""

    def __init__(self, redis_client: Redis, prefix: str = "cache"):
        self.redis = redis_client
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        """Generate prefixed cache key."""
        return f"{self.prefix}:{key}"

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            cached = self.redis.get(self._make_key(key))
            if cached:
                return json.loads(cached)
        except Exception as exc:
            logger.error("Cache get failed for %s: %s", key, exc)
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default 5 minutes)

        Returns:
            True if successful, False otherwise
        """
        try:
            self.redis.setex(
                self._make_key(key),
                ttl,
                json.dumps(value)
            )
            return True
        except Exception as exc:
            logger.error("Cache set failed for %s: %s", key, exc)
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            self.redis.delete(self._make_key(key))
            return True
        except Exception as exc:
            logger.error("Cache delete failed for %s: %s", key, exc)
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        try:
            full_pattern = self._make_key(pattern)
            keys = self.redis.keys(full_pattern)
            if keys:
                return self.redis.delete(*keys)
            return 0
        except Exception as exc:
            logger.error("Cache delete pattern failed for %s: %s", pattern, exc)
            return 0

    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return bool(self.redis.exists(self._make_key(key)))
        except Exception as exc:
            logger.error("Cache exists check failed for %s: %s", key, exc)
            return False


def get_cache() -> Cache:
    """Get cache instance."""
    from app.workers.tasks import redis_conn
    return Cache(redis_conn)


def cached(
    ttl: int = 300,
    key_prefix: str = "",
    key_builder: Optional[Callable] = None
):
    """
    Decorator to cache function results.

    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        key_builder: Optional function to build cache key from args/kwargs
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default: use function name and args
                arg_str = ",".join(str(arg) for arg in args)
                kwarg_str = ",".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = f"{key_prefix}{func.__name__}:{arg_str}:{kwarg_str}"

            cache = get_cache()

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug("Cache hit for %s", cache_key)
                return cached_value

            # Call function and cache result
            logger.debug("Cache miss for %s", cache_key)
            result = func(*args, **kwargs)

            # Only cache if result is not None
            if result is not None:
                cache.set(cache_key, result, ttl)

            return result

        # Add cache management methods to wrapper
        wrapper.cache_clear = lambda: get_cache().delete_pattern(f"{key_prefix}{func.__name__}:*")
        wrapper.cache = get_cache()

        return wrapper
    return decorator


def invalidate_signals_cache():
    """Invalidate all signal-related caches."""
    cache = get_cache()
    patterns = [
        "signals:latest:*",
        "signals:high_confidence:*",
        "signals:analytics:*",
        "market_data:*"
    ]
    for pattern in patterns:
        deleted = cache.delete_pattern(pattern)
        if deleted:
            logger.info("Invalidated %d keys for pattern %s", deleted, pattern)
