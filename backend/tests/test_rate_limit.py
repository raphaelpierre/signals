"""Tests for rate limiting functionality."""
import pytest
import time
from fakeredis import FakeRedis

from app.core.rate_limit import RateLimiter


class TestRateLimiter:
    """Test rate limiter functionality."""

    def test_rate_limit_allows_within_limit(self):
        """Test that requests within limit are allowed."""
        fake_redis = FakeRedis()
        limiter = RateLimiter(fake_redis)

        # Make requests within limit
        for i in range(5):
            allowed, info = limiter.check_rate_limit(
                f"test:user:1",
                limit=10,
                window=60
            )
            assert allowed is True, f"Request {i+1} should be allowed"
            assert info["remaining"] == 10 - (i + 1)

    def test_rate_limit_blocks_over_limit(self):
        """Test that requests over limit are blocked."""
        fake_redis = FakeRedis()
        limiter = RateLimiter(fake_redis)

        # Exhaust the limit
        for _ in range(5):
            limiter.check_rate_limit("test:user:2", limit=5, window=60)

        # Next request should be blocked
        allowed, info = limiter.check_rate_limit(
            "test:user:2",
            limit=5,
            window=60
        )
        assert allowed is False, "Request over limit should be blocked"
        assert info["remaining"] == 0
        assert info["retry_after"] is not None

    def test_rate_limit_resets_after_window(self):
        """Test that rate limit resets after window expires."""
        fake_redis = FakeRedis()
        limiter = RateLimiter(fake_redis)

        # Use up limit in first window
        for _ in range(3):
            limiter.check_rate_limit("test:user:3", limit=3, window=1)

        # Next should be blocked
        allowed, _ = limiter.check_rate_limit("test:user:3", limit=3, window=1)
        assert allowed is False

        # Wait for window to reset
        time.sleep(2)

        # Should be allowed again
        allowed, info = limiter.check_rate_limit("test:user:3", limit=3, window=1)
        assert allowed is True
        assert info["remaining"] == 2

    def test_rate_limit_different_keys_independent(self):
        """Test that different keys have independent limits."""
        fake_redis = FakeRedis()
        limiter = RateLimiter(fake_redis)

        # Use up limit for user 1
        for _ in range(5):
            limiter.check_rate_limit("test:user:1", limit=5, window=60)

        # User 2 should still be allowed
        allowed, info = limiter.check_rate_limit("test:user:2", limit=5, window=60)
        assert allowed is True
        assert info["remaining"] == 4

    def test_rate_limit_info_structure(self):
        """Test that rate limit info has correct structure."""
        fake_redis = FakeRedis()
        limiter = RateLimiter(fake_redis)

        allowed, info = limiter.check_rate_limit("test:user:4", limit=10, window=60)

        assert "limit" in info
        assert "remaining" in info
        assert "reset" in info
        assert "retry_after" in info
        assert info["limit"] == 10
        assert info["remaining"] == 9

    def test_rate_limit_redis_failure_fails_open(self):
        """Test that Redis failures allow requests (fail open)."""
        # Use a mock that raises exceptions
        class FailingRedis:
            def incr(self, key):
                raise Exception("Redis connection failed")

        limiter = RateLimiter(FailingRedis())
        allowed, info = limiter.check_rate_limit("test:user:5", limit=10, window=60)

        # Should fail open and allow request
        assert allowed is True
        assert info["limit"] == 10
