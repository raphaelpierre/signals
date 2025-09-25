from datetime import datetime
from typing import Union, Optional, Dict, Any, List
import json

from pydantic import BaseModel, field_validator


class SignalBase(BaseModel):
    symbol: str
    timeframe: str
    direction: str
    entry_price: float
    target_price: float
    stop_loss: float
    strategy: Union[str, None] = None
    strategy_id: Union[str, None] = None
    confidence: Union[float, None] = None
    quality_score: Union[float, None] = None
    risk_reward_ratio: Union[float, None] = None
    volume_score: Union[float, None] = None
    technical_indicators: Union[Dict[str, Any], str, None] = None
    rationale: Union[List[str], str, None] = None
    regime: Union[Dict[str, str], str, None] = None
    market_conditions: Union[str, None] = None
    latency_ms: Union[int, None] = None
    bt_winrate: Union[float, None] = None
    bt_pf: Union[float, None] = None
    risk_pct: Union[float, None] = 0.5
    is_active: bool = True
    expires_at: Union[datetime, None] = None


class SignalRead(SignalBase):
    id: int
    created_at: datetime

    @field_validator('technical_indicators', 'rationale', 'regime', mode='before')
    @classmethod
    def parse_json_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return v
        elif isinstance(v, (dict, list)):
            # If it's already a dict/list (from database JSON field), return as is
            return v
        return v

    class Config:
        from_attributes = True


class SignalAnalytics(BaseModel):
    total_signals: int
    active_signals: int
    long_signals: int
    short_signals: int
    avg_confidence: float
    avg_risk_reward: float
    top_performing_pairs: list[Dict[str, Any]]
