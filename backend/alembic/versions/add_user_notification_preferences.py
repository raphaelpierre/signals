"""add user notification preferences

Revision ID: add_user_notif_prefs
Revises: add_auto_trading_tables
Create Date: 2025-10-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_notif_prefs'
down_revision = 'add_auto_trading_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add notification preference columns to users table
    op.add_column('users', sa.Column('email_notifications_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('websocket_notifications_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('min_signal_confidence', sa.Integer(), nullable=False, server_default='70'))


def downgrade() -> None:
    # Remove notification preference columns
    op.drop_column('users', 'min_signal_confidence')
    op.drop_column('users', 'websocket_notifications_enabled')
    op.drop_column('users', 'email_notifications_enabled')
