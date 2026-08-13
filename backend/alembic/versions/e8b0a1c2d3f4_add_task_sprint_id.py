"""add sprint reference to tasks

Revision ID: e8b0a1c2d3f4
Revises: c1e4db8e4c6d
Create Date: 2026-08-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8b0a1c2d3f4"
down_revision: Union[str, Sequence[str], None] = "c1e4db8e4c6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("sprint_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_tasks_sprint_id_sprints",
        "tasks",
        "sprints",
        ["sprint_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_tasks_sprint_id"), "tasks", ["sprint_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_sprint_id"), table_name="tasks")
    op.drop_constraint("fk_tasks_sprint_id_sprints", "tasks", type_="foreignkey")
    op.drop_column("tasks", "sprint_id")
