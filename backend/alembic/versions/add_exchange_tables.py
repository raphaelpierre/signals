"""Add exchange connections and trading positions tables

Revision ID: add_exchange_tables
Revises: 
Create Date: 2025-09-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_exchange_tables'
down_revision = None
depends_on = None


def upgrade():
    # Create exchange_connections table
    op.create_table(
        'exchange_connections',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column('exchange_name', sa.String(), nullable=False),
        sa.Column('api_key', sa.Text(), nullable=False),
        sa.Column('api_secret', sa.Text(), nullable=False),
        sa.Column('api_passphrase', sa.Text(), nullable=True),
        sa.Column('sandbox_mode', sa.Boolean(), default=True, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('last_connected', sa.DateTime(), nullable=True),
        sa.Column('balance_cache', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow, nullable=False),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow, nullable=False),
    )

    # Create trading_positions table
    op.create_table(
        'trading_positions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column('exchange_connection_id', sa.Integer(), sa.ForeignKey("exchange_connections.id"), nullable=False),
        sa.Column('signal_id', sa.Integer(), sa.ForeignKey("signals.id"), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('quantity', sa.String(), nullable=False),
        sa.Column('entry_price', sa.String(), nullable=True),
        sa.Column('current_price', sa.String(), nullable=True),
        sa.Column('order_id', sa.String(), nullable=True),
        sa.Column('order_status', sa.String(), nullable=False, default="pending"),
        sa.Column('order_type', sa.String(), nullable=False, default="market"),
        sa.Column('unrealized_pnl', sa.String(), nullable=True),
        sa.Column('realized_pnl', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, default="active"),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow, nullable=False),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow, nullable=False),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
    )

    # Add indexes
    op.create_index('idx_exchange_connections_user_id', 'exchange_connections', ['user_id'])
    op.create_index('idx_exchange_connections_exchange_name', 'exchange_connections', ['exchange_name'])
    op.create_index('idx_trading_positions_user_id', 'trading_positions', ['user_id'])
    op.create_index('idx_trading_positions_status', 'trading_positions', ['status'])
    op.create_index('idx_trading_positions_exchange_connection_id', 'trading_positions', ['exchange_connection_id'])


def downgrade():
    op.drop_table('trading_positions')
    op.drop_table('exchange_connections')