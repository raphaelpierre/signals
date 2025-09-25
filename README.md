# SignalStack – Crypto Trading Signals Platform

SignalStack is a production-ready MVP that delivers subscription-gated crypto trading signals. It pairs a Next.js 14
frontend with a FastAPI backend, PostgreSQL storage, Redis-powered workers, Stripe subscriptions, and CCXT for live
market data ingestion.

## Architecture overview

| Layer      | Technology                                    | Responsibilities |
|-----------|------------------------------------------------|------------------|
| Frontend  | Next.js 14, React 18, SWR                      | Authentication, dashboards, billing entry points |
| Backend   | FastAPI, SQLAlchemy, Pydantic                  | REST API, authentication, Stripe integration |
| Database  | PostgreSQL 15                                  | Persistent storage for users, subscriptions, signals |
| Workers   | Redis 7 + RQ                                   | Background CCXT market polling and signal generation |
| Billing   | Stripe Checkout + Billing Portal               | Subscription management |

## Getting started

### Prerequisites

* Docker and Docker Compose
* Stripe API keys (test mode works for development)

Clone the repository and duplicate the environment template:

```bash
cp .env.example .env
```

Fill in your Stripe credentials and adjust database credentials if required.

### Launch the stack

```bash
docker compose up --build
```

Services become available after a short boot sequence:

* Frontend – <http://localhost:3000>
* Backend – <http://localhost:8000/docs>
* PostgreSQL – `localhost:5432`
* Redis – `localhost:6379`

The FastAPI application auto-creates tables at startup. Sign up on the frontend, log in, and use the Stripe checkout
link from the dashboard to activate your subscription.

### Running locally without Docker

#### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export PYTHONPATH=$(pwd)/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Environment variables can be supplied through an `.env` file (see `.env.example`).

#### Worker

```bash
source .venv/bin/activate
export PYTHONPATH=$(pwd)/backend
python -m app.workers.worker
```

#### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 npm run dev
```

## Stripe integration flow

1. Users register and log in to obtain JWT access tokens.
2. `/api/v1/stripe/checkout-session` creates a subscription checkout URL using the configured Stripe price.
3. Stripe webhooks (`/api/v1/stripe/webhook`) keep the subscription status in sync.
4. Protected routes verify active subscription status before returning signals or enqueueing jobs.

## Signal generation pipeline

* Redis-backed RQ workers run `app.workers.tasks.generate_signals`.
* CCXT fetches OHLCV candles for configured trading pairs (default BTC/USDT, ETH/USDT).
* A simple mean-reversion strategy outputs direction, entry, target, and stop loss.
* Signals are persisted to PostgreSQL and surfaced through the `/signals/latest` endpoint and dashboard table.

## Testing the API

Interactive documentation is available at `/docs`. Example cURL flow:

```bash
# Register a user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "password": "password123"}'

# Obtain a token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=user@example.com&password=password123'

# Trigger a signal refresh (requires active subscription)
curl -X POST http://localhost:8000/api/v1/signals/refresh \
  -H 'Authorization: Bearer <token>'
```

## Folder structure

```
backend/       FastAPI application, models, services, and workers
frontend/      Next.js application
infrastructure/Reserved for Terraform or future IaC modules
docker-compose.yml  Multi-service orchestration
```

## Production hardening checklist

* Swap the naive strategy with your proprietary models or connect to premium signal vendors.
* Add observability (Prometheus, OpenTelemetry, Sentry) and structured logging.
* Harden authentication with refresh tokens, password reset flows, and brute-force protection.
* Expand Stripe products for annual pricing, coupons, and seat management.
* Configure HTTPS termination and WAF/Edge caching via Cloudflare, Fly.io, or AWS ALB.
