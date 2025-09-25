-- SQL script to create exchange tables
CREATE TABLE IF NOT EXISTS exchange_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    exchange_name VARCHAR NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    api_passphrase TEXT,
    sandbox_mode BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_connected TIMESTAMP,
    balance_cache TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS trading_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    exchange_connection_id INTEGER NOT NULL REFERENCES exchange_connections(id),
    signal_id INTEGER NOT NULL REFERENCES signals(id),
    symbol VARCHAR NOT NULL,
    side VARCHAR NOT NULL,
    quantity VARCHAR NOT NULL,
    entry_price VARCHAR,
    current_price VARCHAR,
    order_id VARCHAR,
    order_status VARCHAR NOT NULL DEFAULT 'pending',
    order_type VARCHAR NOT NULL DEFAULT 'market',
    unrealized_pnl VARCHAR,
    realized_pnl VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'active',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exchange_connections_user_id ON exchange_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_exchange_name ON exchange_connections(exchange_name);
CREATE INDEX IF NOT EXISTS idx_trading_positions_user_id ON trading_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_status ON trading_positions(status);
CREATE INDEX IF NOT EXISTS idx_trading_positions_exchange_connection_id ON trading_positions(exchange_connection_id);