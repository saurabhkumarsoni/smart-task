from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.task import Task
from app.models.task_attachment import TaskAttachment
from app.tasks.service import TaskService
from app.users.models import User


def test_create_and_list_task_attachments():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="attach@example.com",
        username="attachuser",
        first_name="Attach",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Attach", key="ATT", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    task = Task(
        project_id=project.id, title="Design", status="todo", created_by=user.id
    )
    session.add(task)
    session.commit()

    service = TaskService(session)
    attachment = service.add_task_attachment(
        task.id,
        {"file_name": "design.png", "content_type": "image/png", "size_bytes": 1024},
    )

    attachments = service.list_task_attachments(task.id)

    assert attachment.file_name == "design.png"
    assert len(attachments) == 1
    assert attachments[0].file_name == "design.png"

    session.close()
