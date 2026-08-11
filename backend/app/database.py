from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import sessionmaker

from app.config import settings


def init_db() -> None:
    from app.models.organization import Organization  # noqa: F401
    from app.models.organization_member import OrganizationMember  # noqa: F401
    from app.models.project import Project  # noqa: F401
    from app.models.project_member import ProjectMember  # noqa: F401
    from app.models.task import Task  # noqa: F401
    from app.models.task_attachment import TaskAttachment  # noqa: F401
    from app.models.comment import Comment  # noqa: F401
    from app.models.task_history import TaskHistory  # noqa: F401
    from app.models.notification import Notification  # noqa: F401
    from app.models.sprint import Sprint  # noqa: F401
    from app.users.models import User  # noqa: F401

    Base.metadata.create_all(bind=engine)


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
