# Database Migration Guide

The new features require additional columns in the `signals` table. Follow these steps to migrate your database.

## Option 1: Using the Migration Script (Recommended)

### If running locally:

```bash
cd backend
python run_migration.py
```

### If running in Docker:

```bash
# Run migration in the backend container
docker-compose exec backend python run_migration.py
```

## Option 2: Manual SQL Execution

### Connect to PostgreSQL:

```bash
# If using Docker
docker-compose exec db psql -U postgres -d signals

# If running locally
psql -U postgres -d signals
```

### Run the migration SQL:

```sql
-- Copy and paste the contents of backend/migrations/001_add_signal_columns.sql
-- Or load it directly:
\i backend/migrations/001_add_signal_columns.sql
```

## Option 3: Automated Docker Migration

Add this to your startup process:

```bash
# In docker-compose.yml, modify the backend command:
backend:
  command: >
    sh -c "python run_migration.py --auto-yes &&
           uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
```

## Verify Migration

After running the migration, verify the columns were added:

```bash
# Check the signals table structure
docker-compose exec db psql -U postgres -d signals -c "\d signals"
```

You should see these new columns:
- quality_score (FLOAT)
- volume_score (FLOAT)
- technical_indicators (TEXT)
- rationale (TEXT)
- regime (TEXT)
- market_conditions (VARCHAR)
- latency_ms (INTEGER)
- bt_winrate (FLOAT)
- bt_pf (FLOAT)
- risk_pct (FLOAT)

## Troubleshooting

### Error: "relation signals does not exist"

The signals table hasn't been created yet. Start your application normally first, then run the migration.

```bash
docker-compose up -d
# Wait a few seconds for tables to be created
docker-compose exec backend python run_migration.py
```

### Error: "column already exists"

This is safe to ignore. The migration uses `IF NOT EXISTS` to handle existing columns.

### Error: "could not connect to database"

Make sure the database container is running:

```bash
docker-compose ps db
docker-compose up -d db
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
ALTER TABLE signals DROP COLUMN IF EXISTS quality_score;
ALTER TABLE signals DROP COLUMN IF EXISTS volume_score;
ALTER TABLE signals DROP COLUMN IF EXISTS technical_indicators;
ALTER TABLE signals DROP COLUMN IF EXISTS rationale;
ALTER TABLE signals DROP COLUMN IF EXISTS regime;
ALTER TABLE signals DROP COLUMN IF EXISTS market_conditions;
ALTER TABLE signals DROP COLUMN IF EXISTS latency_ms;
ALTER TABLE signals DROP COLUMN IF EXISTS bt_winrate;
ALTER TABLE signals DROP COLUMN IF EXISTS bt_pf;
ALTER TABLE signals DROP COLUMN IF EXISTS risk_pct;
```

## Post-Migration

After successful migration:

1. Restart your backend service:
```bash
docker-compose restart backend
```

2. Restart your worker:
```bash
docker-compose restart worker
```

3. Test the API:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/signals/demo
```

You should no longer see the "column does not exist" errors.

## Quick Migration Command

For a fast migration on a running system:

```bash
docker-compose exec backend python run_migration.py
docker-compose restart backend worker
```

That's it! Your database is now ready for the enhanced features. 🚀
