from functools import lru_cache

from pydantic import AnyHttpUrl, BaseModel, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class CorsSettings(BaseModel):
    allow_origins: list[AnyHttpUrl] | list[str] = ["*"]
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    project_name: str = "Signals Backend"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/signals"
    redis_url: str = "redis://redis:6379/0"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id: str = ""

    frontend_base_url: str = "http://localhost:3000"

    ccxt_exchange: str = "binance"
    ccxt_trading_pairs: list[str] = ["BTC/USDT", "ETH/USDT"]

    cors: CorsSettings = CorsSettings()
    cors_origins: str | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def ensure_async_url(cls, value: str) -> str:
        return value.replace("postgres://", "postgresql://")

    @field_validator("frontend_base_url", mode="before")
    @classmethod
    def strip_trailing_slash(cls, value: str) -> str:
        if value.endswith("/"):
            return value.rstrip("/")
        return value

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
