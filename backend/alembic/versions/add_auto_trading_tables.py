"""
Add auto trading tables
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_auto_trading_tables'
down_revision = 'add_exchange_tables'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'auto_trading_configs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('exchange_connection_id', sa.Integer(), sa.ForeignKey('exchange_connections.id'), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('trading_mode', sa.String(), nullable=False, default='signals_only'),
        sa.Column('max_position_size_percent', sa.Float(), nullable=False, default=5.0),
        sa.Column('max_daily_trades', sa.Integer(), nullable=False, default=5),
        sa.Column('max_open_positions', sa.Integer(), nullable=False, default=3),
        sa.Column('stop_loss_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('take_profit_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('min_confidence_score', sa.Float(), nullable=False, default=70.0),
        sa.Column('allowed_symbols', sa.Text(), nullable=True),
        sa.Column('blocked_symbols', sa.Text(), nullable=True),
        sa.Column('allowed_strategies', sa.Text(), nullable=True),
        sa.Column('follow_portfolio_allocation', sa.Boolean(), nullable=False, default=False),
        sa.Column('rebalance_frequency', sa.String(), nullable=False, default='weekly'),
        sa.Column('target_allocations', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_trade_at', sa.DateTime(), nullable=True)
    )
    op.create_table(
        'auto_trades',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('config_id', sa.Integer(), sa.ForeignKey('auto_trading_configs.id'), nullable=False),
        sa.Column('signal_id', sa.Integer(), sa.ForeignKey('signals.id'), nullable=False),
        sa.Column('trading_position_id', sa.Integer(), sa.ForeignKey('trading_positions.id'), nullable=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('trigger_reason', sa.String(), nullable=False),
        sa.Column('executed', sa.Boolean(), nullable=False, default=False),
        sa.Column('execution_price', sa.String(), nullable=True),
        sa.Column('quantity', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('executed_at', sa.DateTime(), nullable=True)
    )
    op.create_table(
        'portfolio_allocations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('target_percentage', sa.Float(), nullable=False),
        sa.Column('current_percentage', sa.Float(), nullable=True),
        sa.Column('min_investment_amount', sa.Float(), nullable=False, default=25.0),
        sa.Column('auto_rebalance', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_rebalanced_at', sa.DateTime(), nullable=True)
    )
    op.create_table(
        'crypto_watchlists',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False, default=1),
        sa.Column('auto_trade_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('price_alerts_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('price_alert_above', sa.Float(), nullable=True),
        sa.Column('price_alert_below', sa.Float(), nullable=True),
        sa.Column('volume_alert_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )

def downgrade():
    op.drop_table('crypto_watchlists')
    op.drop_table('portfolio_allocations')
    op.drop_table('auto_trades')
    op.drop_table('auto_trading_configs')
