"""Tests for signal generation and API endpoints."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.models.signal import Signal
from app.workers.tasks import (
    calculate_rsi,
    calculate_bollinger_bands,
    calculate_confidence_score,
    generate_signal_rationale
)


class TestTechnicalIndicators:
    """Test technical indicator calculations."""

    def test_calculate_rsi_oversold(self):
        """Test RSI calculation for oversold conditions."""
        prices = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 48, 46, 44, 42]
        rsi = calculate_rsi(prices, period=14)
        assert rsi < 30, "RSI should indicate oversold"

    def test_calculate_rsi_overbought(self):
        """Test RSI calculation for overbought conditions."""
        prices = [50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78]
        rsi = calculate_rsi(prices, period=14)
        assert rsi > 70, "RSI should indicate overbought"

    def test_calculate_rsi_insufficient_data(self):
        """Test RSI with insufficient data returns default."""
        prices = [100, 105, 110]
        rsi = calculate_rsi(prices, period=14)
        assert rsi == 50.0, "Should return default RSI for insufficient data"

    def test_calculate_bollinger_bands(self):
        """Test Bollinger Bands calculation."""
        prices = [100] * 20  # Flat prices
        lower, middle, upper = calculate_bollinger_bands(prices, period=20, std_dev=2)

        assert lower == middle == upper == 100.0, "Flat prices should have equal bands"

    def test_calculate_bollinger_bands_volatile(self):
        """Test Bollinger Bands with volatile prices."""
        prices = list(range(80, 120))  # Trending prices
        lower, middle, upper = calculate_bollinger_bands(prices, period=20, std_dev=2)

        assert lower < middle < upper, "Bands should be properly ordered"
        assert (upper - lower) > 0, "Band width should be positive"


class TestConfidenceScoring:
    """Test confidence score calculations."""

    def test_long_signal_high_confidence(self):
        """Test high confidence LONG signal."""
        confidence = calculate_confidence_score(
            rsi=30,  # Oversold
            bb_position=0.2,  # Near lower band
            volume_score=70,  # High volume
            macd_histogram=0.5,  # Positive
            direction="LONG"
        )
        assert confidence >= 75, "Should have high confidence"

    def test_short_signal_high_confidence(self):
        """Test high confidence SHORT signal."""
        confidence = calculate_confidence_score(
            rsi=70,  # Overbought
            bb_position=0.8,  # Near upper band
            volume_score=70,  # High volume
            macd_histogram=-0.5,  # Negative
            direction="SHORT"
        )
        assert confidence >= 75, "Should have high confidence"

    def test_contradictory_signals_low_confidence(self):
        """Test contradictory indicators result in low confidence."""
        confidence = calculate_confidence_score(
            rsi=70,  # Overbought (bearish)
            bb_position=0.2,  # Near lower band (bullish)
            volume_score=30,  # Low volume
            macd_histogram=0.5,  # Positive (bullish)
            direction="LONG"
        )
        assert confidence < 60, "Contradictory signals should have low confidence"


class TestSignalRationale:
    """Test signal rationale generation."""

    def test_long_signal_rationale(self):
        """Test LONG signal rationale generation."""
        rationale = generate_signal_rationale(
            rsi=35,
            bb_position=0.25,
            macd_histogram=0.5,
            volume_score=65,
            direction="LONG",
            market_conditions="bullish"
        )

        assert len(rationale) > 0, "Should generate rationale"
        assert len(rationale) <= 3, "Should limit to 3 rationale points"
        assert any("RSI" in r for r in rationale), "Should mention RSI"

    def test_short_signal_rationale(self):
        """Test SHORT signal rationale generation."""
        rationale = generate_signal_rationale(
            rsi=65,
            bb_position=0.75,
            macd_histogram=-0.5,
            volume_score=65,
            direction="SHORT",
            market_conditions="bearish"
        )

        assert len(rationale) > 0, "Should generate rationale"
        assert any("RSI" in r or "Bollinger" in r or "MACD" in r for r in rationale)


class TestSignalAPI:
    """Test signal API endpoints."""

    def test_get_latest_signals_unauthorized(self, client):
        """Test latest signals requires authentication."""
        response = client.get("/api/v1/signals/latest")
        assert response.status_code == 401

    def test_get_latest_signals_authorized(self, client, auth_headers, db: Session):
        """Test latest signals with valid authentication."""
        # Create test signal
        signal = Signal(
            symbol="BTC/USDT",
            timeframe="1h",
            direction="LONG",
            entry_price=50000.0,
            target_price=51000.0,
            stop_loss=49000.0,
            strategy="test",
            confidence=80.0,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(signal)
        db.commit()

        response = client.get("/api/v1/signals/latest", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_historic_signals_public(self, client, db: Session):
        """Test historic signals endpoint is public."""
        # Create old signal
        signal = Signal(
            symbol="BTC/USDT",
            timeframe="1h",
            direction="LONG",
            entry_price=50000.0,
            target_price=51000.0,
            stop_loss=49000.0,
            strategy="test",
            confidence=80.0,
            is_active=False,
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(signal)
        db.commit()

        response = client.get("/api/v1/signals/historic")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_demo_signals_public(self, client, db: Session):
        """Test demo signals endpoint is public."""
        # Create high-quality historic signal
        signal = Signal(
            symbol="BTC/USDT",
            timeframe="1h",
            direction="LONG",
            entry_price=50000.0,
            target_price=51000.0,
            stop_loss=49000.0,
            strategy="test",
            confidence=85.0,
            risk_reward_ratio=2.0,
            is_active=False,
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(signal)
        db.commit()

        response = client.get("/api/v1/signals/demo")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @patch('app.workers.tasks.enqueue_signal_job')
    def test_refresh_signals_rate_limit(self, mock_enqueue, client, auth_headers):
        """Test signal refresh has rate limiting."""
        # First request should succeed
        response1 = client.post("/api/v1/signals/refresh", headers=auth_headers)
        assert response1.status_code == 200

        # Subsequent rapid requests should be rate limited
        for _ in range(6):
            response = client.post("/api/v1/signals/refresh", headers=auth_headers)

        # At least one should be rate limited
        assert response.status_code == 429 or mock_enqueue.call_count <= 5

    def test_filter_signals_by_symbol(self, client, auth_headers, db: Session):
        """Test filtering signals by symbol."""
        # Create signals for different symbols
        for symbol in ["BTC/USDT", "ETH/USDT"]:
            signal = Signal(
                symbol=symbol,
                timeframe="1h",
                direction="LONG",
                entry_price=50000.0,
                target_price=51000.0,
                stop_loss=49000.0,
                strategy="test",
                confidence=80.0,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(signal)
        db.commit()

        response = client.get(
            "/api/v1/signals/latest?symbol=BTC/USDT",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        if data:
            assert all(s["symbol"] == "BTC/USDT" for s in data)

    def test_filter_signals_by_confidence(self, client, auth_headers, db: Session):
        """Test filtering signals by minimum confidence."""
        # Create signals with varying confidence
        for conf in [60, 75, 90]:
            signal = Signal(
                symbol="BTC/USDT",
                timeframe="1h",
                direction="LONG",
                entry_price=50000.0,
                target_price=51000.0,
                stop_loss=49000.0,
                strategy="test",
                confidence=float(conf),
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(signal)
        db.commit()

        response = client.get(
            "/api/v1/signals/latest?min_confidence=80",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        if data:
            assert all(s["confidence"] >= 80 for s in data)


class TestSignalExpiration:
    """Test signal expiration logic."""

    def test_expired_signals_deactivated(self, client, auth_headers, db: Session):
        """Test that expired signals are automatically deactivated."""
        # Create expired signal
        signal = Signal(
            symbol="BTC/USDT",
            timeframe="1h",
            direction="LONG",
            entry_price=50000.0,
            target_price=51000.0,
            stop_loss=49000.0,
            strategy="test",
            confidence=80.0,
            is_active=True,
            expires_at=datetime.utcnow() - timedelta(hours=1),
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(signal)
        db.commit()

        # Fetch latest signals (should trigger expiration check)
        response = client.get("/api/v1/signals/latest", headers=auth_headers)
        assert response.status_code == 200

        # Check signal was deactivated
        db.refresh(signal)
        assert signal.is_active is False, "Expired signal should be deactivated"
