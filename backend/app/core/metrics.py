"""Prometheus metrics for monitoring."""
from prometheus_client import Counter, Histogram, Gauge, Info
from typing import Dict, Any

# API Metrics
api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint']
)

# Signal Metrics
signals_generated_total = Counter(
    'signals_generated_total',
    'Total signals generated',
    ['symbol', 'direction', 'confidence_bucket']
)

signal_generation_duration_seconds = Histogram(
    'signal_generation_duration_seconds',
    'Signal generation duration in seconds',
    ['symbol']
)

signals_active = Gauge(
    'signals_active',
    'Number of currently active signals'
)

signal_quality_score = Histogram(
    'signal_quality_score',
    'Signal quality score distribution',
    ['symbol', 'direction'],
    buckets=[0, 20, 40, 60, 80, 100]
)

# Exchange API Metrics
exchange_api_calls_total = Counter(
    'exchange_api_calls_total',
    'Total exchange API calls',
    ['exchange', 'operation', 'status']
)

exchange_api_errors_total = Counter(
    'exchange_api_errors_total',
    'Total exchange API errors',
    ['exchange', 'error_type']
)

exchange_api_duration_seconds = Histogram(
    'exchange_api_duration_seconds',
    'Exchange API call duration',
    ['exchange', 'operation']
)

# Cache Metrics
cache_operations_total = Counter(
    'cache_operations_total',
    'Total cache operations',
    ['operation', 'result']
)

cache_hit_rate = Gauge(
    'cache_hit_rate',
    'Cache hit rate percentage',
    ['cache_type']
)

# Rate Limit Metrics
rate_limit_exceeded_total = Counter(
    'rate_limit_exceeded_total',
    'Total rate limit violations',
    ['identifier_type', 'endpoint']
)

# Database Metrics
db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['operation', 'table']
)

db_connections = Gauge(
    'db_connections',
    'Number of database connections',
    ['state']
)

# Worker Metrics
worker_jobs_total = Counter(
    'worker_jobs_total',
    'Total worker jobs',
    ['job_type', 'status']
)

worker_job_duration_seconds = Histogram(
    'worker_job_duration_seconds',
    'Worker job duration',
    ['job_type']
)

# Subscription Metrics
active_subscriptions = Gauge(
    'active_subscriptions',
    'Number of active subscriptions'
)

subscription_events_total = Counter(
    'subscription_events_total',
    'Total subscription events',
    ['event_type']
)

# Application Info
app_info = Info('app', 'Application information')


def record_api_request(method: str, endpoint: str, status: int, duration: float):
    """Record API request metrics."""
    api_requests_total.labels(method=method, endpoint=endpoint, status=str(status)).inc()
    api_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)


def record_signal_generated(symbol: str, direction: str, confidence: float, duration: float):
    """Record signal generation metrics."""
    confidence_bucket = "high" if confidence >= 80 else "medium" if confidence >= 60 else "low"
    signals_generated_total.labels(
        symbol=symbol,
        direction=direction,
        confidence_bucket=confidence_bucket
    ).inc()
    signal_generation_duration_seconds.labels(symbol=symbol).observe(duration)


def record_exchange_call(exchange: str, operation: str, status: str, duration: float):
    """Record exchange API call metrics."""
    exchange_api_calls_total.labels(
        exchange=exchange,
        operation=operation,
        status=status
    ).inc()
    exchange_api_duration_seconds.labels(
        exchange=exchange,
        operation=operation
    ).observe(duration)


def record_exchange_error(exchange: str, error_type: str):
    """Record exchange API error."""
    exchange_api_errors_total.labels(exchange=exchange, error_type=error_type).inc()


def record_cache_operation(operation: str, result: str):
    """Record cache operation."""
    cache_operations_total.labels(operation=operation, result=result).inc()
