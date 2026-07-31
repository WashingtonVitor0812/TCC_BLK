"""adiciona datas de criacao e edicao

Revision ID: 6f8d9b7c2a10
Revises: 97011b40df25
"""
from alembic import op
import sqlalchemy as sa

revision = "6f8d9b7c2a10"
down_revision = "97011b40df25"
branch_labels = None
depends_on = None


def upgrade():
    for tabela in ("cliente", "servico", "atendimento"):
        with op.batch_alter_table(tabela) as batch_op:
            batch_op.add_column(sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")))
            batch_op.add_column(sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")))


def downgrade():
    for tabela in ("atendimento", "servico", "cliente"):
        with op.batch_alter_table(tabela) as batch_op:
            batch_op.drop_column("atualizado_em")
            batch_op.drop_column("criado_em")
