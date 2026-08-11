import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.common.base import TimestampMixin
from app.common.base import UUIDMixin
from app.database import Base


class AppMetadata(
    UUIDMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "app_metadata"

    key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    value: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
