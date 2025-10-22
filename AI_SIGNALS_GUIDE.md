# AI Trading Signals System - Complete Guide

## Overview

SignalStack now features an **AI-powered ensemble trading signal generation system** that uses multiple machine learning models to generate high-quality trading signals. Signals are automatically delivered to users via WebSocket in real-time and optionally via email.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Signal Generation Flow                   │
└─────────────────────────────────────────────────────────────┘

1. RQ Worker (Background Job)
   └─> Fetch OHLCV data from CCXT (Binance/etc)
   └─> Calculate technical indicators (RSI, MACD, Bollinger Bands)
   └─> AI Model Service (Ensemble Prediction)
       ├─> Technical Indicator Model
       ├─> Momentum Model
       ├─> Mean Reversion Model
       └─> Volatility Breakout Model
   └─> Generate Signal with Entry/Target/Stop Loss
   └─> Save to PostgreSQL Database
   └─> Publish to Redis Pub/Sub Channel

2. Notification Service
   └─> Redis Pub/Sub Subscriber
   └─> Broadcast to WebSocket clients
   └─> Queue email notifications (optional)

3. User Receives Signal
   └─> WebSocket (real-time, < 1 second)
   └─> Email (asynchronous, 1-5 minutes)
```

## AI Model Service

### Ensemble Strategy

The AI Model Service uses an **ensemble approach** combining 4 specialized models:

#### 1. Technical Indicator Model (30% weight)
- **Signals**: RSI oversold/overbought, MACD crossovers, Bollinger Band position
- **Best for**: Identifying extreme market conditions
- **Confidence**: High when multiple indicators align

#### 2. Momentum Model (30% weight)
- **Signals**: Price momentum, volume confirmation, trend alignment
- **Best for**: Trending markets and breakouts
- **Confidence**: High with strong price moves and volume

#### 3. Mean Reversion Model (20% weight)
- **Signals**: Price at Bollinger Band extremes, RSI extremes
- **Best for**: Range-bound markets, overextended moves
- **Confidence**: Higher in low volatility environments

#### 4. Volatility Breakout Model (20% weight)
- **Signals**: Low volatility + high volume, Bollinger Band squeeze
- **Best for**: Identifying breakout opportunities
- **Confidence**: High when volatility precedes volume spike

### Feature Engineering

The AI service prepares 16 features for prediction:

```python
Features:
- Price changes (5, 10, 20 periods)
- Volatility measures (5, 10 periods)
- Volume metrics (ratio, trend)
- Bollinger Band position and width
- RSI levels and zones
- MACD strength and crossovers
- Trend alignment (SMA crossovers)
- Price momentum
```

### Signal Generation Logic

```python
# Ensemble voting
long_score = Σ(model_score × weight) for LONG predictions
short_score = Σ(model_score × weight) for SHORT predictions

# Decision criteria
if abs(long_score - short_score) < 0.15:
    return NO_SIGNAL  # Not enough conviction

if max(long_score, short_score) < 0.65:
    return NO_SIGNAL  # Low confidence

direction = "LONG" if long_score > short_score else "SHORT"
confidence = max(long_score, short_score) × 100
```

### Dynamic Risk Management

Entry, target, and stop-loss levels are calculated dynamically:

```python
# ATR-based risk calculation
atr_percent = atr / current_price

# Confidence-based multipliers
confidence_multiplier = confidence / 100.0

# For LONG signals
target = entry × (1 + atr_percent × (1.5 + confidence_multiplier × 1.5))
stop_loss = entry × (1 - atr_percent × (1.5 - confidence_multiplier × 0.7))

# Risk/Reward ratio must be >= 1.2 for signal to qualify
```

**Result**: Higher confidence signals get wider targets and tighter stops.

## Notification System

### WebSocket Notifications (Real-Time)

#### How It Works

1. **Worker generates signal** → Saves to database
2. **Calls `notify_new_signal_sync()`** → Publishes to Redis pub/sub
3. **WebSocket subscriber** → Listens to Redis channel
4. **Broadcasts to connected clients** → Filtered by symbol subscriptions

#### Connection Flow

```javascript
// Frontend client example
const ws = new WebSocket(`ws://localhost:8000/api/v1/ws?token=${jwt_token}`);

ws.onopen = () => {
  // Subscribe to specific symbols
  ws.send(JSON.stringify({
    action: "subscribe",
    symbol: "BTC/USDT"
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "new_signal") {
    const signal = message.data;
    console.log(`New ${signal.direction} signal for ${signal.symbol}`);
    console.log(`Entry: ${signal.entry_price}, Target: ${signal.target_price}`);
    console.log(`Confidence: ${signal.confidence}%`);
    // Update UI with signal
  }
};
```

#### WebSocket Message Format

```json
{
  "type": "new_signal",
  "data": {
    "id": 123,
    "symbol": "BTC/USDT",
    "direction": "LONG",
    "entry_price": 45000.0,
    "target_price": 46500.0,
    "stop_loss": 44200.0,
    "confidence": 78.5,
    "risk_reward_ratio": 2.15,
    "strategy": "ai-ensemble",
    "created_at": "2025-10-22T10:30:00",
    "expires_at": "2025-10-23T10:30:00",
    "rationale": [
      "High confidence LONG signal (78.5%) from AI ensemble model",
      "Strong consensus across all prediction models (agreement: 0.45)",
      "Technical indicators showing strong long signal (score: 0.85)"
    ]
  },
  "timestamp": "2025-10-22T10:30:00.123Z"
}
```

### Email Notifications (Asynchronous)

Email notifications are queued in Redis and processed by a separate worker:

```
Signal Generated → Queue Email → Email Worker → Send via SendGrid/SES
```

**Current Status**: Email queuing implemented, but actual sending requires:
- Set up SendGrid, Amazon SES, or similar
- Configure API keys
- Uncomment email worker in docker-compose

## User Notification Preferences

Users can customize their notification settings:

```python
# User model fields
user.email_notifications_enabled = True/False
user.websocket_notifications_enabled = True/False
user.min_signal_confidence = 70  # Only receive signals >= 70% confidence
```

**Future Enhancement**: API endpoints to manage preferences in dashboard.

## Running the System

### 1. Apply Database Migration

```bash
cd backend
alembic upgrade head
```

This adds the new user notification preference columns.

### 2. Start All Services

```bash
docker-compose up --build
```

This starts:
- PostgreSQL (database)
- Redis (cache + pub/sub)
- Backend API (FastAPI)
- RQ Worker (signal generation)
- Frontend (Next.js)

### 3. Generate Signals

#### Manual Trigger (API)

```bash
curl -X POST http://localhost:8000/api/v1/signals/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Automatic (Scheduled)

Set up a cron job or use APScheduler:

```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(
    enqueue_signal_job,
    'interval',
    hours=1  # Generate signals every hour
)
scheduler.start()
```

### 4. Connect via WebSocket

```bash
# Test WebSocket connection
npm install -g wscat
wscat -c "ws://localhost:8000/api/v1/ws?token=YOUR_JWT_TOKEN"

# Subscribe to BTC/USDT
> {"action": "subscribe", "symbol": "BTC/USDT"}

# Wait for signals...
< {"type": "new_signal", "data": {...}}
```

## Testing the Flow

### End-to-End Test

```bash
# Terminal 1: Watch worker logs
docker-compose logs -f worker

# Terminal 2: Connect WebSocket client
wscat -c "ws://localhost:8000/api/v1/ws?token=YOUR_TOKEN"
> {"action": "subscribe", "symbol": "BTC/USDT"}

# Terminal 3: Trigger signal generation
curl -X POST http://localhost:8000/api/v1/signals/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected flow:
# 1. Worker fetches market data (Terminal 1)
# 2. AI model generates predictions (Terminal 1)
# 3. Signal saved to database (Terminal 1)
# 4. Notification published to Redis (Terminal 1)
# 5. WebSocket receives signal (Terminal 2)
```

### Unit Testing

```bash
cd backend
pytest tests/test_signals.py -v
```

## Monitoring

### Metrics

All signal generation is tracked in Prometheus metrics:

```
# Signal generation
signal_generation_total{status="success|failed"}
signal_generation_duration_seconds

# AI model performance
ai_model_predictions_total{direction="LONG|SHORT"}
ai_model_confidence_score (histogram)

# Notifications
signal_notifications_total{type="websocket|email", status="success|failed"}
```

View at: `http://localhost:8000/metrics`

### Logs

```bash
# Structured JSON logs
docker-compose logs -f worker | grep "signal"
docker-compose logs -f backend | grep "notification"
```

## Configuration

### Environment Variables

```bash
# AI Model Settings
AI_MODEL_TYPE=ensemble  # ensemble, lstm, random_forest
AI_MIN_CONFIDENCE=65    # Minimum confidence to generate signal
AI_MIN_RISK_REWARD=1.2  # Minimum R/R ratio

# Notification Settings
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_WEBSOCKET_NOTIFICATIONS=true
REDIS_PUBSUB_CHANNEL=signal_notifications

# Email Service (when enabled)
SENDGRID_API_KEY=your_key
EMAIL_FROM_ADDRESS=signals@yourcompany.com
```

## Extending the System

### Adding Custom AI Models

```python
# In app/services/ai_model_service.py

class AIModelService:
    def _custom_model(self, features: np.ndarray) -> Tuple[float, str]:
        """Your custom prediction logic"""
        # Option 1: Load pre-trained model
        model = joblib.load('models/my_model.pkl')
        prediction = model.predict([features])

        # Option 2: API-based model
        response = requests.post(
            'https://api.yourservice.com/predict',
            json={'features': features.tolist()}
        )

        # Option 3: Cloud ML service
        client = sagemaker.Session()
        prediction = client.invoke_endpoint(...)

        return score, direction
```

### Adding SMS/Telegram Notifications

```python
# In app/core/notifications.py

def send_telegram_notification(user_id: int, signal: Signal):
    import telegram
    bot = telegram.Bot(token=settings.telegram_bot_token)

    message = f"""
    🚨 New {signal.direction} Signal

    Symbol: {signal.symbol}
    Entry: ${signal.entry_price}
    Target: ${signal.target_price}
    Stop Loss: ${signal.stop_loss}
    Confidence: {signal.confidence}%
    """

    bot.send_message(chat_id=user_id, text=message)
```

## Troubleshooting

### Signals Not Being Generated

```bash
# Check worker is running
docker-compose ps worker

# Check worker logs
docker-compose logs worker

# Common issues:
# 1. CCXT rate limits → Check for RateLimitError
# 2. Invalid symbols → Check settings.ccxt_trading_pairs
# 3. Insufficient data → Need 50+ candles
```

### WebSocket Not Receiving Signals

```bash
# 1. Check Redis pub/sub
docker-compose exec redis redis-cli
> SUBSCRIBE signal_notifications
> # Trigger signal, see if message appears

# 2. Check WebSocket subscriber is running
docker-compose logs backend | grep "WebSocket subscriber"

# 3. Verify user is subscribed to symbol
# In WebSocket client:
> {"action": "subscribe", "symbol": "BTC/USDT"}
< {"type": "subscribed", "symbol": "BTC/USDT"}
```

### Low Signal Quality

```bash
# Adjust AI model thresholds
# In app/services/ai_model_service.py

# Increase minimum confidence
if final_confidence < 70:  # Was 65
    return None

# Increase agreement threshold
if abs(long_score - short_score) < 0.20:  # Was 0.15
    return None
```

## Performance

### Expected Throughput

- **Signal Generation**: 10 symbols in ~20 seconds (sequential)
- **WebSocket Delivery**: < 100ms after signal created
- **Email Delivery**: 1-5 minutes (asynchronous)

### Optimization Tips

1. **Parallel Signal Generation**:
   ```python
   # Use asyncio for concurrent processing
   signals = await asyncio.gather(*[
       generate_signal_for_pair_async(symbol)
       for symbol in settings.ccxt_trading_pairs
   ])
   ```

2. **Cache Market Data**:
   ```python
   # Already implemented with 30-second TTL
   cache_key = f"ohlcv:{symbol}:{timeframe}"
   cache.set(cache_key, ohlcv, ttl=30)
   ```

3. **Batch Email Sending**:
   ```python
   # Process emails in batches
   EmailWorker().process_email_queue(max_batch=100)
   ```

## Production Recommendations

### Before Going Live

- [ ] Replace mock backtest metrics with real historical testing
- [ ] Implement proper EMA calculation (current is simplified)
- [ ] Set up actual email service (SendGrid/SES)
- [ ] Add rate limiting on signal generation per user
- [ ] Implement WebSocket connection limits
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Set up monitoring dashboards (Grafana)
- [ ] Load test with 1000+ concurrent WebSocket connections
- [ ] Implement signal archiving for old signals
- [ ] Add A/B testing framework for model improvements

### Security

- [ ] Validate all WebSocket messages
- [ ] Implement WebSocket authentication refresh
- [ ] Rate limit WebSocket subscriptions
- [ ] Sanitize all user inputs
- [ ] Encrypt sensitive signal data at rest
- [ ] Audit log all signal generations

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review metrics: `http://localhost:8000/metrics`
- API docs: `http://localhost:8000/docs`
- GitHub Issues: [Your repo URL]

## License

MIT License - See LICENSE file for details
