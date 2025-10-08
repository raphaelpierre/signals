"""Enhanced logging configuration with structured logging."""
import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional context."""

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)

        # Add timestamp in ISO format
        log_record['timestamp'] = datetime.utcnow().isoformat()

        # Add log level
        log_record['level'] = record.levelname

        # Add module and function info
        log_record['module'] = record.module
        log_record['function'] = record.funcName

        # Add environment info
        log_record['environment'] = 'production'  # Can be set from env var

        # Add exception info if present
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)


def setup_logging(json_logs: bool = False, log_level: str = "INFO") -> None:
    """
    Configure logging for the application.

    Args:
        json_logs: If True, use JSON structured logging
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    level = getattr(logging, log_level.upper(), logging.INFO)

    # Remove existing handlers
    root = logging.getLogger()
    for handler in root.handlers[:]:
        root.removeHandler(handler)

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)

    if json_logs:
        # Use JSON formatter for structured logging
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        # Use standard formatter for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

    handler.setFormatter(formatter)
    root.addHandler(handler)
    root.setLevel(level)

    # Set specific loggers to appropriate levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("ccxt").setLevel(logging.WARNING)


class MetricsLogger:
    """Logger for application metrics."""

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def log_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "",
        tags: Dict[str, str] = None
    ) -> None:
        """Log a metric value."""
        metric_data = {
            "metric": metric_name,
            "value": value,
            "unit": unit,
            "tags": tags or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        self.logger.info(f"METRIC: {json.dumps(metric_data)}")

    def log_signal_generated(
        self,
        symbol: str,
        direction: str,
        confidence: float,
        generation_time_ms: float
    ) -> None:
        """Log signal generation metrics."""
        self.log_metric(
            "signal_generated",
            1,
            "count",
            {
                "symbol": symbol,
                "direction": direction,
                "confidence_bucket": self._confidence_bucket(confidence)
            }
        )
        self.log_metric(
            "signal_generation_time",
            generation_time_ms,
            "milliseconds",
            {"symbol": symbol}
        )

    def log_api_request(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: float,
        user_id: int = None
    ) -> None:
        """Log API request metrics."""
        tags = {
            "endpoint": endpoint,
            "method": method,
            "status": str(status_code),
        }
        if user_id:
            tags["user_id"] = str(user_id)

        self.log_metric("api_request", 1, "count", tags)
        self.log_metric("api_request_duration", duration_ms, "milliseconds", tags)

    def log_cache_hit(self, cache_key: str, hit: bool) -> None:
        """Log cache hit/miss."""
        self.log_metric(
            "cache_hit" if hit else "cache_miss",
            1,
            "count",
            {"key_prefix": cache_key.split(":")[0]}
        )

    def log_exchange_error(self, exchange: str, symbol: str, error_type: str) -> None:
        """Log exchange API errors."""
        self.log_metric(
            "exchange_error",
            1,
            "count",
            {
                "exchange": exchange,
                "symbol": symbol,
                "error_type": error_type
            }
        )

    def log_rate_limit_exceeded(self, identifier: str, endpoint: str) -> None:
        """Log rate limit violations."""
        self.log_metric(
            "rate_limit_exceeded",
            1,
            "count",
            {
                "identifier": identifier,
                "endpoint": endpoint
            }
        )

    @staticmethod
    def _confidence_bucket(confidence: float) -> str:
        """Convert confidence to bucket for better grouping."""
        if confidence >= 80:
            return "high"
        elif confidence >= 60:
            return "medium"
        else:
            return "low"


def get_metrics_logger(name: str = __name__) -> MetricsLogger:
    """Get a metrics logger instance."""
    return MetricsLogger(logging.getLogger(name))
