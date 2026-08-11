"""add users role column

Revision ID: 21bdef628fb9
Revises: 5567b4a75a95
Create Date: 2026-08-10 15:00:32.716303

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "21bdef628fb9"
down_revision: Union[str, Sequence[str], None] = "5567b4a75a95"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

userrole_enum = postgresql.ENUM("USER", "ADMIN", name="userrole")


def upgrade() -> None:
    """Upgrade schema."""
    userrole_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column("role", userrole_enum, server_default="USER", nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "role")
    userrole_enum.drop(op.get_bind(), checkfirst=True)
