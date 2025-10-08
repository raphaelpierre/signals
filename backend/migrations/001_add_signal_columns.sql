-- Add new columns to signals table
-- Run this migration to add columns needed for enhanced signal features

-- Add quality_score column
ALTER TABLE signals ADD COLUMN IF NOT EXISTS quality_score FLOAT;

-- Add volume_score column
ALTER TABLE signals ADD COLUMN IF NOT EXISTS volume_score FLOAT;

-- Add technical_indicators column (JSON stored as text)
ALTER TABLE signals ADD COLUMN IF NOT EXISTS technical_indicators TEXT;

-- Add rationale column (JSON array stored as text)
ALTER TABLE signals ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Add regime column (JSON object stored as text)
ALTER TABLE signals ADD COLUMN IF NOT EXISTS regime TEXT;

-- Add market_conditions column
ALTER TABLE signals ADD COLUMN IF NOT EXISTS market_conditions VARCHAR(50);

-- Add latency_ms column
ALTER TABLE signals ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

-- Add backtest win rate column
ALTER TABLE signals ADD COLUMN IF NOT EXISTS bt_winrate FLOAT;

-- Add backtest profit factor column
ALTER TABLE signals ADD COLUMN IF NOT EXISTS bt_pf FLOAT;

-- Add risk percentage column with default
ALTER TABLE signals ADD COLUMN IF NOT EXISTS risk_pct FLOAT DEFAULT 0.5;

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);

-- Create index on symbol for filtering
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);

-- Create index on confidence for high-confidence queries
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence);

-- Create index on is_active for active signal queries
CREATE INDEX IF NOT EXISTS idx_signals_is_active ON signals(is_active);

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'signals'
ORDER BY ordinal_position;
