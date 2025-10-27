#!/bin/bash
set -e

echo "🚀 Deployment Health Check Script"
echo "=================================="

# Check if environment variables are set
required_vars=(
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET_KEY"
  "STRIPE_API_KEY"
)

echo "1. Checking environment variables..."
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

echo ""
echo "2. Testing database connection..."
python -c "
from sqlalchemy import create_engine
import os
engine = create_engine(os.environ['DATABASE_URL'])
conn = engine.connect()
conn.close()
print('✅ Database connection successful')
"

echo ""
echo "3. Testing Redis connection..."
python -c "
from redis import Redis
import os
redis_client = Redis.from_url(os.environ['REDIS_URL'])
redis_client.ping()
print('✅ Redis connection successful')
"

echo ""
echo "4. Running database migrations..."
cd backend
alembic upgrade head
echo "✅ Migrations applied"

echo ""
echo "=================================="
echo "✅ All health checks passed!"
echo "=================================="
