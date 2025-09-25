from functools import lru_cache
from typing import List, Union

from pydantic import AnyHttpUrl, BaseModel, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class CorsSettings(BaseModel):
    allow_origins: Union[List[AnyHttpUrl], List[str]] = ["*"]
    allow_credentials: bool = True
    allow_methods: List[str] = ["*"]
    allow_headers: List[str] = ["*"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    project_name: str = "Signals Backend"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/signals"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id: str = ""

    ccxt_exchange: str = "binance"
    ccxt_trading_pairs: List[str] = [
        "BTC/USDT", "ETH/USDT", "BNB/USDT", "ADA/USDT", "SOL/USDT", 
        "MATIC/USDT", "DOT/USDT", "AVAX/USDT", "LINK/USDT", "UNI/USDT"
    ]
    
    # Encryption key for API credentials (should be set in production)
    encryption_key: str = ""

    cors: CorsSettings = CorsSettings()
    cors_origins: Union[str, None] = None

    @field_validator("database_url", mode="before")
    @classmethod
    def ensure_async_url(cls, value: str) -> str:
        return value.replace("postgres://", "postgresql://")

    @model_validator(mode="after")
    def split_cors_origins(self) -> "Settings":
        if self.cors_origins:
            origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
            if origins:
                self.cors.allow_origins = origins
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
