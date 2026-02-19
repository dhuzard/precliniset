"""increase api_token hash lengths

Revision ID: 1f2e3d4c5b6a
Revises: b5c0ee68a663
Create Date: 2026-02-19 15:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1f2e3d4c5b6a'
down_revision = 'b5c0ee68a663'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('api_token', schema=None) as batch_op:
        batch_op.alter_column('token_hash',
               existing_type=sa.String(length=128),
               type_=sa.String(length=256),
               existing_nullable=False)
        batch_op.alter_column('prefix_hash',
               existing_type=sa.String(length=128),
               type_=sa.String(length=256),
               existing_nullable=False)


def downgrade():
    with op.batch_alter_table('api_token', schema=None) as batch_op:
        batch_op.alter_column('prefix_hash',
               existing_type=sa.String(length=256),
               type_=sa.String(length=128),
               existing_nullable=False)
        batch_op.alter_column('token_hash',
               existing_type=sa.String(length=256),
               type_=sa.String(length=128),
               existing_nullable=False)
