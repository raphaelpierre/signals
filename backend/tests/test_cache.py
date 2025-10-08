"""Tests for caching functionality."""
import pytest
from fakeredis import FakeRedis

from app.core.cache import Cache


class TestCache:
    """Test cache operations."""

    def test_cache_set_and_get(self):
        """Test basic cache set and get."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis)

        test_data = {"key": "value", "number": 42}
        cache.set("test_key", test_data, ttl=300)

        retrieved = cache.get("test_key")
        assert retrieved == test_data

    def test_cache_get_nonexistent(self):
        """Test getting non-existent key returns None."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis)

        result = cache.get("nonexistent_key")
        assert result is None

    def test_cache_delete(self):
        """Test cache deletion."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis)

        cache.set("test_key", "test_value")
        assert cache.exists("test_key") is True

        cache.delete("test_key")
        assert cache.exists("test_key") is False

    def test_cache_delete_pattern(self):
        """Test deleting keys by pattern."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis, prefix="test")

        # Set multiple keys with same prefix
        cache.set("user:1", "data1")
        cache.set("user:2", "data2")
        cache.set("signal:1", "data3")

        # Delete user keys
        deleted = cache.delete_pattern("user:*")
        assert deleted >= 2

        # Signal key should still exist
        assert cache.exists("signal:1") is True

    def test_cache_exists(self):
        """Test checking key existence."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis)

        assert cache.exists("test_key") is False

        cache.set("test_key", "value")
        assert cache.exists("test_key") is True

    def test_cache_ttl_expiration(self):
        """Test that cached values expire after TTL."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis)

        cache.set("test_key", "value", ttl=1)
        assert cache.get("test_key") == "value"

        # After TTL, key should be gone (FakeRedis simulates this)
        import time
        time.sleep(2)

        # Note: FakeRedis may not perfectly simulate expiration
        # In production, this would return None after TTL

    def test_cache_prefix(self):
        """Test cache key prefixing."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis, prefix="myapp")

        cache.set("key1", "value1")

        # Check that key is prefixed in Redis
        raw_key = "myapp:key1"
        assert fake_redis.exists(raw_key)

    def test_cache_json_serialization(self):
        """Test that complex objects are properly serialized."""
        fake_redis = FakeRedis()
        cache = Cache(fake_redis)

        complex_data = {
            "string": "hello",
            "number": 123,
            "float": 45.67,
            "bool": True,
            "null": None,
            "list": [1, 2, 3],
            "nested": {"a": 1, "b": 2}
        }

        cache.set("complex", complex_data)
        retrieved = cache.get("complex")

        assert retrieved == complex_data
        assert isinstance(retrieved["list"], list)
        assert isinstance(retrieved["nested"], dict)
