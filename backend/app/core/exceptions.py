"""Custom exceptions for the application."""


class SignalException(Exception):
    """Base exception for signal-related errors."""
    pass


class ExchangeAPIError(SignalException):
    """Raised when exchange API calls fail."""
    def __init__(self, exchange: str, symbol: str, message: str):
        self.exchange = exchange
        self.symbol = symbol
        self.message = message
        super().__init__(f"{exchange} API error for {symbol}: {message}")


class InsufficientDataError(SignalException):
    """Raised when not enough data is available for analysis."""
    def __init__(self, symbol: str, required: int, available: int):
        self.symbol = symbol
        self.required = required
        self.available = available
        super().__init__(f"Insufficient data for {symbol}: need {required}, got {available}")


class RateLimitError(SignalException):
    """Raised when exchange rate limit is hit."""
    def __init__(self, exchange: str, retry_after: int = None):
        self.exchange = exchange
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded for {exchange}" +
                        (f", retry after {retry_after}s" if retry_after else ""))


class SubscriptionError(Exception):
    """Raised when subscription validation fails."""
    pass
