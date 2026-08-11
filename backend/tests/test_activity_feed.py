from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.task import Task
from app.task_history.service import TaskHistoryService
from app.users.models import User


def test_activity_feed_lists_task_history_entries():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="activity@example.com",
        username="activityuser",
        first_name="Act",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Feed", key="FEED", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    task = Task(project_id=project.id, title="Plan", status="todo", created_by=user.id)
    session.add(task)
    session.commit()

    history_service = TaskHistoryService(session)
    history_service.create_history_entry(
        task.id, None, "todo", changed_by=user, action="created"
    )
    history_service.create_history_entry(
        task.id, "todo", "in_progress", changed_by=user, action="updated"
    )

    entries = history_service.list_history(task.id)

    assert len(entries) == 2
    assert entries[0].action == "updated"
    assert entries[1].action == "created"

    session.close()
