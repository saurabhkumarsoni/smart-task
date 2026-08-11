"""add comments table

Revision ID: c1e4db8e4c6d
Revises: 9b7a5df3d4bc
Create Date: 2026-08-10 15:50:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c1e4db8e4c6d"
down_revision: Union[str, Sequence[str], None] = "9b7a5df3d4bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_task_id"), "comments", ["task_id"], unique=False)
    op.create_index(
        op.f("ix_comments_author_id"), "comments", ["author_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_comments_author_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_task_id"), table_name="comments")
    op.drop_table("comments")
