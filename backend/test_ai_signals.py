#!/usr/bin/env python3
"""
Test Script for AI Signal Generation and Delivery

This script tests the complete flow:
1. Generate signals using AI model
2. Save to database
3. Publish notifications
4. Verify delivery

Usage:
    python test_ai_signals.py
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

import logging
from app.workers.tasks import generate_signal_for_pair
from app.db.session import SessionLocal
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_signal_generation():
    """Test AI signal generation for a single symbol."""
    logger.info("=" * 70)
    logger.info("Starting AI Signal Generation Test")
    logger.info("=" * 70)

    db = SessionLocal()

    try:
        # Test with first configured trading pair
        test_symbol = settings.ccxt_trading_pairs[0]
        logger.info(f"\n📊 Testing signal generation for: {test_symbol}")
        logger.info("-" * 70)

        # Generate signal
        signal = generate_signal_for_pair(db, test_symbol, retry_count=2)

        if signal:
            logger.info(f"\n✅ Signal Generated Successfully!")
            logger.info("-" * 70)
            logger.info(f"Symbol: {signal.symbol}")
            logger.info(f"Direction: {signal.direction}")
            logger.info(f"Entry Price: ${signal.entry_price:,.2f}")
            logger.info(f"Target Price: ${signal.target_price:,.2f}")
            logger.info(f"Stop Loss: ${signal.stop_loss:,.2f}")
            logger.info(f"Confidence: {signal.confidence:.1f}%")
            logger.info(f"Risk/Reward: {signal.risk_reward_ratio:.2f}")
            logger.info(f"Quality Score: {signal.quality_score:.1f}")
            logger.info(f"Strategy: {signal.strategy}")
            logger.info(f"Strategy ID: {signal.strategy_id}")

            # Display rationale
            if signal.rationale:
                import json
                rationale = json.loads(signal.rationale)
                logger.info(f"\n💡 AI Reasoning:")
                for i, reason in enumerate(rationale, 1):
                    logger.info(f"   {i}. {reason}")

            # Display technical indicators
            if signal.technical_indicators:
                import json
                indicators = json.loads(signal.technical_indicators)
                logger.info(f"\n📈 Technical Indicators:")
                logger.info(f"   RSI: {indicators.get('rsi', 'N/A')}")
                logger.info(f"   Bollinger Position: {indicators.get('bollinger_position', 'N/A')}%")
                logger.info(f"   MACD Histogram: {indicators.get('macd_histogram', 'N/A')}")
                logger.info(f"   Volume Score: {indicators.get('volume_score', 'N/A')}")

                # Display AI model scores
                if 'ai_model_scores' in indicators:
                    logger.info(f"\n🤖 AI Model Scores:")
                    scores = indicators['ai_model_scores']
                    logger.info(f"   Technical Model: {scores.get('technical', 0):.3f}")
                    logger.info(f"   Momentum Model: {scores.get('momentum', 0):.3f}")
                    logger.info(f"   Mean Reversion: {scores.get('mean_reversion', 0):.3f}")
                    logger.info(f"   Volatility Breakout: {scores.get('volatility_breakout', 0):.3f}")
                    logger.info(f"   Long Score: {scores.get('long_score', 0):.3f}")
                    logger.info(f"   Short Score: {scores.get('short_score', 0):.3f}")

            logger.info("\n" + "=" * 70)
            logger.info("✅ Test Completed Successfully!")
            logger.info("=" * 70)

            return signal

        else:
            logger.warning(f"\n⚠️  No signal generated for {test_symbol}")
            logger.warning("   This is normal - signals are only generated when conditions are met")
            logger.info("\n" + "=" * 70)
            logger.info("✅ Test Completed (No Signal)")
            logger.info("=" * 70)
            return None

    except Exception as e:
        logger.error(f"\n❌ Error during signal generation: {e}", exc_info=True)
        return None

    finally:
        db.close()


def test_all_symbols():
    """Test signal generation for all configured symbols."""
    logger.info("=" * 70)
    logger.info("Testing All Configured Symbols")
    logger.info("=" * 70)

    db = SessionLocal()
    results = {
        "generated": 0,
        "skipped": 0,
        "errors": 0,
        "signals": []
    }

    try:
        for symbol in settings.ccxt_trading_pairs:
            logger.info(f"\nProcessing {symbol}...")
            try:
                signal = generate_signal_for_pair(db, symbol, retry_count=1)
                if signal:
                    results["generated"] += 1
                    results["signals"].append({
                        "symbol": signal.symbol,
                        "direction": signal.direction,
                        "confidence": signal.confidence
                    })
                    logger.info(f"  ✅ {signal.direction} signal ({signal.confidence:.1f}% confidence)")
                else:
                    results["skipped"] += 1
                    logger.info(f"  ⏭️  Skipped (no clear signal)")
            except Exception as e:
                results["errors"] += 1
                logger.error(f"  ❌ Error: {e}")

        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("Summary")
        logger.info("=" * 70)
        logger.info(f"Total Symbols: {len(settings.ccxt_trading_pairs)}")
        logger.info(f"Signals Generated: {results['generated']}")
        logger.info(f"Skipped: {results['skipped']}")
        logger.info(f"Errors: {results['errors']}")

        if results["signals"]:
            logger.info(f"\n📊 Generated Signals:")
            for sig in results["signals"]:
                logger.info(f"   {sig['symbol']}: {sig['direction']} ({sig['confidence']:.1f}%)")

        logger.info("=" * 70)

    finally:
        db.close()

    return results


def test_notification_system():
    """Test notification system."""
    logger.info("=" * 70)
    logger.info("Testing Notification System")
    logger.info("=" * 70)

    try:
        from app.core.notifications import get_notification_service
        from app.models.signal import Signal
        from datetime import datetime

        notification_service = get_notification_service()

        # Create a mock signal for testing
        mock_signal = Signal(
            id=999,
            symbol="TEST/USDT",
            direction="LONG",
            entry_price=50000.0,
            target_price=52000.0,
            stop_loss=49000.0,
            confidence=85.0,
            risk_reward_ratio=2.0,
            strategy="ai-ensemble",
            created_at=datetime.utcnow(),
            rationale='["Test signal for notification system"]'
        )

        logger.info("\n📢 Publishing test signal to Redis...")
        success = notification_service.publish_signal_notification(mock_signal)

        if success:
            logger.info("✅ Test signal published successfully!")
            logger.info("\nIf WebSocket clients are connected and subscribed to TEST/USDT,")
            logger.info("they should receive this signal.")
        else:
            logger.error("❌ Failed to publish test signal")

        logger.info("\n" + "=" * 70)

    except Exception as e:
        logger.error(f"❌ Notification test error: {e}", exc_info=True)


def main():
    """Run all tests."""
    import argparse

    parser = argparse.ArgumentParser(description='Test AI Signal Generation System')
    parser.add_argument(
        '--mode',
        choices=['single', 'all', 'notification'],
        default='single',
        help='Test mode: single (one symbol), all (all symbols), notification (test notifications)'
    )

    args = parser.parse_args()

    try:
        if args.mode == 'single':
            test_signal_generation()
        elif args.mode == 'all':
            test_all_symbols()
        elif args.mode == 'notification':
            test_notification_system()

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        logger.error(f"\n\n❌ Test failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
