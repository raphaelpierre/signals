"""add signal enhancements

Revision ID: 001
Revises:
Create Date: 2025-10-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to signals table if they don't exist
    with op.batch_alter_table('signals', schema=None) as batch_op:
        # Check and add columns one by one
        try:
            batch_op.add_column(sa.Column('quality_score', sa.Float(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('volume_score', sa.Float(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('technical_indicators', sa.Text(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('rationale', sa.Text(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('regime', sa.Text(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('market_conditions', sa.String(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('latency_ms', sa.Integer(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('bt_winrate', sa.Float(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('bt_pf', sa.Float(), nullable=True))
        except:
            pass

        try:
            batch_op.add_column(sa.Column('risk_pct', sa.Float(), nullable=True, server_default='0.5'))
        except:
            pass


def downgrade():
    with op.batch_alter_table('signals', schema=None) as batch_op:
        batch_op.drop_column('risk_pct')
        batch_op.drop_column('bt_pf')
        batch_op.drop_column('bt_winrate')
        batch_op.drop_column('latency_ms')
        batch_op.drop_column('market_conditions')
        batch_op.drop_column('regime')
        batch_op.drop_column('rationale')
        batch_op.drop_column('technical_indicators')
        batch_op.drop_column('volume_score')
        batch_op.drop_column('quality_score')
