"""
Add signal quality score fields
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_signal_quality_fields'
down_revision = 'add_auto_trading_tables'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('signals', sa.Column('quality_score', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('rationale', sa.Text(), nullable=True))  # JSON list of string rationales
    op.add_column('signals', sa.Column('regime', sa.Text(), nullable=True))  # JSON object with trend, vol, liq
    op.add_column('signals', sa.Column('latency_ms', sa.Integer(), nullable=True))
    op.add_column('signals', sa.Column('bt_winrate', sa.Float(), nullable=True))
    op.add_column('signals', sa.Column('bt_pf', sa.Float(), nullable=True))  # Profit factor
    op.add_column('signals', sa.Column('risk_pct', sa.Float(), nullable=True, default=0.5))  # Default risk percentage
    op.add_column('signals', sa.Column('strategy_id', sa.String(), nullable=True))  # Strategy identifier

def downgrade():
    op.drop_column('signals', 'quality_score')
    op.drop_column('signals', 'rationale')
    op.drop_column('signals', 'regime')
    op.drop_column('signals', 'latency_ms')
    op.drop_column('signals', 'bt_winrate')
    op.drop_column('signals', 'bt_pf')
    op.drop_column('signals', 'risk_pct')
    op.drop_column('signals', 'strategy_id')