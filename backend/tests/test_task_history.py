from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.task import Task
from app.models.task_history import TaskHistory
from app.tasks.service import TaskService
from app.users.models import User


def test_task_updates_create_history_entry():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="history@example.com",
        username="history",
        first_name="History",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="History", key="HST", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    task = Task(
        project_id=project.id, title="Audit task", status="todo", created_by=user.id
    )
    session.add(task)
    session.flush()

    service = TaskService(session)
    service.update_task(
        project.id, task.id, {"status": "in_progress"}, current_user=user
    )

    history = session.query(TaskHistory).filter(TaskHistory.task_id == task.id).first()

    assert history is not None
    assert history.previous_status == "todo"
    assert history.new_status == "in_progress"

    session.close()
