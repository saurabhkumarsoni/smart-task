"""add task history table

Revision ID: d7e4e18b2b3f
Revises: a2f75f8d81e1
Create Date: 2026-08-10 15:40:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d7e4e18b2b3f"
down_revision: Union[str, Sequence[str], None] = "a2f75f8d81e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("changed_by", sa.Uuid(), nullable=True),
        sa.Column("previous_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_task_history_task_id"), "task_history", ["task_id"], unique=False
    )
    op.create_index(
        op.f("ix_task_history_changed_by"), "task_history", ["changed_by"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_task_history_changed_by"), table_name="task_history")
    op.drop_index(op.f("ix_task_history_task_id"), table_name="task_history")
    op.drop_table("task_history")
