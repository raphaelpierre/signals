"""
AI Model Service for Trading Signal Generation

This service integrates machine learning models to generate trading signals.
It supports multiple model types and provides a clean interface for signal prediction.
"""

import logging
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class AIModelService:
    """
    AI Model Service for generating trading signals using machine learning.

    This service can be extended to use:
    - Pre-trained models (LSTM, GRU, Transformer)
    - Cloud-based ML services (AWS SageMaker, Google Vertex AI)
    - Local sklearn/XGBoost models
    - API-based models (OpenAI, Anthropic, etc.)
    """

    def __init__(self, model_type: str = "ensemble"):
        """
        Initialize AI Model Service.

        Args:
            model_type: Type of model to use (ensemble, lstm, random_forest, api)
        """
        self.model_type = model_type
        self.model_version = "v1.0.0"
        logger.info(f"Initialized AI Model Service with type: {model_type}")

    def prepare_features(
        self,
        closes: List[float],
        highs: List[float],
        lows: List[float],
        volumes: List[float],
        rsi: float,
        macd_line: float,
        macd_signal: float,
        macd_histogram: float,
        bb_lower: float,
        bb_middle: float,
        bb_upper: float
    ) -> np.ndarray:
        """
        Prepare features for ML model.

        Creates a feature vector combining price action, technical indicators,
        and derived features.
        """
        current_price = closes[-1]

        # Price-based features
        price_change_5 = (closes[-1] - closes[-5]) / closes[-5] if len(closes) >= 5 else 0
        price_change_10 = (closes[-1] - closes[-10]) / closes[-10] if len(closes) >= 10 else 0
        price_change_20 = (closes[-1] - closes[-20]) / closes[-20] if len(closes) >= 20 else 0

        # Volatility features
        volatility_5 = np.std(closes[-5:]) / np.mean(closes[-5:]) if len(closes) >= 5 else 0
        volatility_10 = np.std(closes[-10:]) / np.mean(closes[-10:]) if len(closes) >= 10 else 0

        # Volume features
        volume_ratio = volumes[-1] / np.mean(volumes[-20:]) if len(volumes) >= 20 and np.mean(volumes[-20:]) > 0 else 1
        volume_trend = (np.mean(volumes[-5:]) - np.mean(volumes[-20:-5])) / np.mean(volumes[-20:-5]) if len(volumes) >= 20 and np.mean(volumes[-20:-5]) > 0 else 0

        # Bollinger Band position
        bb_position = (current_price - bb_lower) / (bb_upper - bb_lower) if bb_upper != bb_lower else 0.5
        bb_width = (bb_upper - bb_lower) / bb_middle if bb_middle > 0 else 0

        # RSI-based features
        rsi_normalized = rsi / 100.0
        rsi_overbought = 1.0 if rsi > 70 else 0.0
        rsi_oversold = 1.0 if rsi < 30 else 0.0

        # MACD features
        macd_signal_cross = 1.0 if macd_histogram > 0 else -1.0
        macd_strength = abs(macd_histogram) / (abs(macd_line) + 1e-6)

        # Trend features
        sma_5 = np.mean(closes[-5:]) if len(closes) >= 5 else current_price
        sma_20 = np.mean(closes[-20:]) if len(closes) >= 20 else current_price
        trend_alignment = 1.0 if sma_5 > sma_20 else -1.0

        # Compile feature vector
        features = np.array([
            price_change_5,
            price_change_10,
            price_change_20,
            volatility_5,
            volatility_10,
            volume_ratio,
            volume_trend,
            bb_position,
            bb_width,
            rsi_normalized,
            rsi_overbought,
            rsi_oversold,
            macd_signal_cross,
            macd_strength,
            trend_alignment,
            # Normalized price momentum
            (closes[-1] - closes[-1 if len(closes) < 2 else -2]) / closes[-1] if len(closes) >= 2 else 0,
        ])

        return features

    def predict_signal(
        self,
        symbol: str,
        closes: List[float],
        highs: List[float],
        lows: List[float],
        volumes: List[float],
        technical_indicators: Dict
    ) -> Optional[Dict]:
        """
        Generate trading signal using AI model.

        Returns:
            Dict with prediction results or None if no signal
            {
                "direction": "LONG" or "SHORT",
                "confidence": float (0-100),
                "entry_price": float,
                "target_price": float,
                "stop_loss": float,
                "model_scores": dict,
                "reasoning": list of strings
            }
        """
        try:
            # Extract technical indicators
            rsi = technical_indicators.get("rsi", 50)
            macd_line = technical_indicators.get("macd_line", 0)
            macd_signal = technical_indicators.get("macd_signal", 0)
            macd_histogram = technical_indicators.get("macd_histogram", 0)
            bb_lower = technical_indicators.get("bb_lower", 0)
            bb_middle = technical_indicators.get("bb_middle", 0)
            bb_upper = technical_indicators.get("bb_upper", 0)

            # Prepare features
            features = self.prepare_features(
                closes, highs, lows, volumes,
                rsi, macd_line, macd_signal, macd_histogram,
                bb_lower, bb_middle, bb_upper
            )

            # Get predictions from ensemble of models
            predictions = self._ensemble_predict(features, technical_indicators)

            if not predictions:
                return None

            # Generate signal details
            signal = self._generate_signal_details(
                symbol, closes, highs, lows,
                predictions, technical_indicators
            )

            return signal

        except Exception as e:
            logger.error(f"Error in AI model prediction for {symbol}: {e}")
            return None

    def _ensemble_predict(
        self,
        features: np.ndarray,
        technical_indicators: Dict
    ) -> Optional[Dict]:
        """
        Ensemble prediction combining multiple models/strategies.

        In production, this would call actual ML models.
        For now, it uses an enhanced rule-based ensemble.
        """
        # Model 1: Technical Indicator Model
        tech_score, tech_direction = self._technical_model(technical_indicators)

        # Model 2: Momentum Model
        momentum_score, momentum_direction = self._momentum_model(features)

        # Model 3: Mean Reversion Model
        mr_score, mr_direction = self._mean_reversion_model(features, technical_indicators)

        # Model 4: Volatility Breakout Model
        vb_score, vb_direction = self._volatility_breakout_model(features, technical_indicators)

        # Ensemble voting with weighted scores
        model_votes = {
            "technical": (tech_direction, tech_score, 0.3),
            "momentum": (momentum_direction, momentum_score, 0.3),
            "mean_reversion": (mr_direction, mr_score, 0.2),
            "volatility_breakout": (vb_direction, vb_score, 0.2)
        }

        # Calculate weighted direction
        long_score = sum(score * weight for direction, score, weight in model_votes.values() if direction == "LONG")
        short_score = sum(score * weight for direction, score, weight in model_votes.values() if direction == "SHORT")

        # No clear signal if scores are too close
        if abs(long_score - short_score) < 0.15:
            return None

        final_direction = "LONG" if long_score > short_score else "SHORT"
        final_confidence = max(long_score, short_score) * 100

        # Minimum confidence threshold
        if final_confidence < 65:
            return None

        return {
            "direction": final_direction,
            "confidence": final_confidence,
            "model_scores": {
                "technical": tech_score,
                "momentum": momentum_score,
                "mean_reversion": mr_score,
                "volatility_breakout": vb_score,
                "long_score": long_score,
                "short_score": short_score
            }
        }

    def _technical_model(self, indicators: Dict) -> Tuple[float, str]:
        """Technical indicator-based model."""
        rsi = indicators.get("rsi", 50)
        macd_histogram = indicators.get("macd_histogram", 0)
        bb_position = indicators.get("bb_position", 0.5)

        score = 0.0
        signals = []

        # RSI signals
        if rsi < 30:
            score += 0.4
            signals.append("LONG")
        elif rsi > 70:
            score += 0.4
            signals.append("SHORT")
        elif rsi < 45:
            score += 0.2
            signals.append("LONG")
        elif rsi > 55:
            score += 0.2
            signals.append("SHORT")

        # MACD signals
        if macd_histogram > 0:
            score += 0.3 if "LONG" in signals or not signals else -0.1
            if "LONG" not in signals:
                signals.append("LONG")
        else:
            score += 0.3 if "SHORT" in signals or not signals else -0.1
            if "SHORT" not in signals:
                signals.append("SHORT")

        # Bollinger Band signals
        if bb_position < 0.2:
            score += 0.3 if "LONG" in signals else 0.1
            if "LONG" not in signals:
                signals.append("LONG")
        elif bb_position > 0.8:
            score += 0.3 if "SHORT" in signals else 0.1
            if "SHORT" not in signals:
                signals.append("SHORT")

        # Determine primary direction
        long_signals = signals.count("LONG")
        short_signals = signals.count("SHORT")

        direction = "LONG" if long_signals > short_signals else "SHORT"
        score = min(1.0, max(0.0, score))

        return score, direction

    def _momentum_model(self, features: np.ndarray) -> Tuple[float, str]:
        """Momentum-based model."""
        price_change_5 = features[0]
        price_change_10 = features[1]
        volume_ratio = features[5]
        trend_alignment = features[14]

        score = 0.0

        # Strong momentum signals
        if price_change_5 > 0.02 and price_change_10 > 0.03 and volume_ratio > 1.2:
            score = 0.8
            direction = "LONG"
        elif price_change_5 < -0.02 and price_change_10 < -0.03 and volume_ratio > 1.2:
            score = 0.8
            direction = "SHORT"
        # Moderate momentum
        elif price_change_5 > 0.01 and trend_alignment > 0:
            score = 0.6
            direction = "LONG"
        elif price_change_5 < -0.01 and trend_alignment < 0:
            score = 0.6
            direction = "SHORT"
        else:
            score = 0.3
            direction = "LONG" if price_change_5 > 0 else "SHORT"

        return score, direction

    def _mean_reversion_model(self, features: np.ndarray, indicators: Dict) -> Tuple[float, str]:
        """Mean reversion strategy model."""
        bb_position = features[7]
        rsi = indicators.get("rsi", 50)
        volatility = features[3]

        score = 0.0

        # Strong mean reversion signals (oversold/overbought)
        if bb_position < 0.1 and rsi < 30:
            score = 0.9
            direction = "LONG"
        elif bb_position > 0.9 and rsi > 70:
            score = 0.9
            direction = "SHORT"
        # Moderate signals
        elif bb_position < 0.3 and rsi < 40:
            score = 0.6
            direction = "LONG"
        elif bb_position > 0.7 and rsi > 60:
            score = 0.6
            direction = "SHORT"
        else:
            score = 0.2
            direction = "LONG" if bb_position < 0.5 else "SHORT"

        # Adjust for volatility (mean reversion works better in lower volatility)
        if volatility > 0.05:  # High volatility
            score *= 0.7

        return score, direction

    def _volatility_breakout_model(self, features: np.ndarray, indicators: Dict) -> Tuple[float, str]:
        """Volatility breakout model."""
        bb_width = features[8]
        volume_ratio = features[5]
        bb_position = features[7]
        price_momentum = features[15]

        score = 0.0

        # Breakout signals (price breaking out of consolidation)
        if bb_width < 0.02 and volume_ratio > 1.5:  # Low volatility + high volume
            if bb_position > 0.7 and price_momentum > 0:
                score = 0.85
                direction = "LONG"
            elif bb_position < 0.3 and price_momentum < 0:
                score = 0.85
                direction = "SHORT"
            else:
                score = 0.4
                direction = "LONG" if price_momentum > 0 else "SHORT"
        else:
            score = 0.3
            direction = "LONG" if bb_position > 0.5 else "SHORT"

        return score, direction

    def _generate_signal_details(
        self,
        symbol: str,
        closes: List[float],
        highs: List[float],
        lows: List[float],
        predictions: Dict,
        technical_indicators: Dict
    ) -> Dict:
        """Generate detailed signal with entry, target, stop loss."""
        direction = predictions["direction"]
        confidence = predictions["confidence"]
        model_scores = predictions["model_scores"]

        current_price = closes[-1]

        # Calculate ATR for dynamic stop loss/target
        atr = np.mean([highs[i] - lows[i] for i in range(-20, 0)])
        atr_percent = atr / current_price

        # Dynamic target and stop loss based on confidence and volatility
        confidence_multiplier = confidence / 100.0

        if direction == "LONG":
            # Entry at current price
            entry_price = current_price

            # Target: 1.5-3% based on confidence
            target_multiplier = 1.5 + (confidence_multiplier * 1.5)
            target_price = entry_price * (1 + (atr_percent * target_multiplier))

            # Stop loss: 0.8-1.5% based on confidence (tighter for higher confidence)
            stop_multiplier = 1.5 - (confidence_multiplier * 0.7)
            stop_loss = entry_price * (1 - (atr_percent * stop_multiplier))

        else:  # SHORT
            entry_price = current_price

            target_multiplier = 1.5 + (confidence_multiplier * 1.5)
            target_price = entry_price * (1 - (atr_percent * target_multiplier))

            stop_multiplier = 1.5 - (confidence_multiplier * 0.7)
            stop_loss = entry_price * (1 + (atr_percent * stop_multiplier))

        # Calculate risk/reward ratio
        risk = abs(entry_price - stop_loss)
        reward = abs(target_price - entry_price)
        risk_reward_ratio = reward / risk if risk > 0 else 0

        # Generate AI reasoning
        reasoning = self._generate_reasoning(
            direction, model_scores, technical_indicators, confidence
        )

        return {
            "direction": direction,
            "confidence": round(confidence, 1),
            "entry_price": entry_price,
            "target_price": target_price,
            "stop_loss": stop_loss,
            "risk_reward_ratio": risk_reward_ratio,
            "model_scores": {k: round(v, 3) for k, v in model_scores.items()},
            "reasoning": reasoning,
            "model_version": self.model_version
        }

    def _generate_reasoning(
        self,
        direction: str,
        model_scores: Dict,
        indicators: Dict,
        confidence: float
    ) -> List[str]:
        """Generate human-readable reasoning for the signal."""
        reasoning = []

        # Overall confidence
        if confidence >= 80:
            reasoning.append(f"High confidence {direction} signal ({confidence:.1f}%) from AI ensemble model")
        else:
            reasoning.append(f"Moderate confidence {direction} signal ({confidence:.1f}%) from AI ensemble model")

        # Model agreement
        long_score = model_scores.get("long_score", 0)
        short_score = model_scores.get("short_score", 0)
        agreement = abs(long_score - short_score)

        if agreement > 0.4:
            reasoning.append(f"Strong consensus across all prediction models (agreement: {agreement:.2f})")
        elif agreement > 0.25:
            reasoning.append(f"Moderate consensus across prediction models (agreement: {agreement:.2f})")

        # Top contributing models
        scores = [
            ("Technical indicators", model_scores.get("technical", 0)),
            ("Momentum analysis", model_scores.get("momentum", 0)),
            ("Mean reversion", model_scores.get("mean_reversion", 0)),
            ("Volatility breakout", model_scores.get("volatility_breakout", 0))
        ]
        scores.sort(key=lambda x: x[1], reverse=True)

        if scores[0][1] > 0.7:
            reasoning.append(f"{scores[0][0]} showing strong {direction.lower()} signal (score: {scores[0][1]:.2f})")

        # Technical context
        rsi = indicators.get("rsi", 50)
        if direction == "LONG" and rsi < 40:
            reasoning.append(f"RSI at {rsi:.1f} indicates oversold conditions supporting upside")
        elif direction == "SHORT" and rsi > 60:
            reasoning.append(f"RSI at {rsi:.1f} indicates overbought conditions supporting downside")

        return reasoning[:3]  # Return top 3 reasons


# Singleton instance
_model_service: Optional[AIModelService] = None


def get_ai_model_service(model_type: str = "ensemble") -> AIModelService:
    """Get or create AI model service instance."""
    global _model_service
    if _model_service is None:
        _model_service = AIModelService(model_type=model_type)
    return _model_service
