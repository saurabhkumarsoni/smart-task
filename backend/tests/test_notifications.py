from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.notification import Notification
from app.models.project import Project
from app.models.task import Task
from app.notifications.service import NotificationService
from app.users.models import User


def test_create_notification_for_task_update():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="notify@example.com",
        username="notify",
        first_name="Notify",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Notify", key="NTF", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    task = Task(
        project_id=project.id, title="Alert task", status="todo", created_by=user.id
    )
    session.add(task)
    session.flush()

    service = NotificationService(session)
    notification = service.create_notification(
        user_id=user.id,
        task_id=task.id,
        title="Task updated",
        message="The task status changed",
    )

    saved = (
        session.query(Notification).filter(Notification.id == notification.id).first()
    )

    assert saved is not None
    assert saved.user_id == user.id
    assert saved.task_id == task.id
    assert saved.title == "Task updated"

    session.close()


def test_notification_summary_groups_unread_items_and_provides_digest():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="digest@example.com",
        username="digest",
        first_name="Digest",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Digest", key="DGT", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    task = Task(
        project_id=project.id, title="Digest task", status="todo", created_by=user.id
    )
    session.add(task)
    session.flush()

    service = NotificationService(session)
    service.create_notification(
        user_id=user.id,
        task_id=task.id,
        title="Task reminder",
        message="Reminder: Task 'Digest task' is due on 2026-08-15",
    )
    unread_notification = service.create_notification(
        user_id=user.id,
        task_id=task.id,
        title="Task updated",
        message="Task status changed to in_progress",
    )
    service.mark_as_read(unread_notification.id, user.id)

    summary = service.get_summary(user.id)

    assert summary["unread_count"] == 1
    assert summary["total_count"] == 2
    assert summary["digest"].startswith("You have 1 unread notification")
    assert "Digest task" in summary["digest"]

    session.close()
