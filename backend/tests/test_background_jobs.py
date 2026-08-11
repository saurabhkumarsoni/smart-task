import threading
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.database import Base
from app.jobs.router import run_job
from app.jobs.service import JobService
from app.models.notification import Notification
from app.models.project import Project
from app.notifications.service import NotificationService
from app.tasks.service import TaskService
from app.users.models import User


def test_job_service_executes_registered_job():
    service = JobService()

    calls = []

    def sample_job():
        calls.append("done")

    service.register("sample", sample_job)
    service.enqueue("sample")
    service.run_pending()

    assert calls == ["done"]


def test_task_creation_with_due_date_schedules_reminder_notification():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="reminder@example.com",
        username="reminder",
        first_name="Reminder",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(
        name="Reminders",
        key="RMD",
        description="Reminder tests",
        owner_id=user.id,
    )
    session.add(project)
    session.flush()

    service = TaskService(session)
    task = service.create_task(
        project_id=project.id,
        data={
            "title": "Ship release",
            "due_date": datetime.now(timezone.utc) + timedelta(days=1),
        },
        current_user=user,
    )

    notification = session.scalar(
        select(Notification).where(Notification.task_id == task.id)
    )

    assert notification is not None
    assert "due" in notification.message.lower()

    session.close()


def test_job_service_starts_background_worker():
    service = JobService()
    calls = []
    started = threading.Event()

    def sample_job():
        calls.append("done")
        started.set()

    service.register("sample", sample_job)
    service.start_worker(interval=0.01)
    service.enqueue("sample")

    assert started.wait(timeout=1.0)
    service.stop_worker()

    assert calls == ["done"]


def test_job_service_stops_background_worker_cleanly():
    service = JobService()
    service.register("sample", lambda: None)
    service.start_worker(interval=0.01)
    service.stop_worker()

    assert service._worker_thread is None
    assert service._stop_event is None


def test_cleanup_notifications_job_removes_read_notifications():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="cleanup@example.com",
        username="cleanup",
        first_name="Cleanup",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    notification_service = NotificationService(session)
    notification_service.create_notification(
        user_id=user.id,
        task_id=None,
        title="Read notification",
        message="This one is already read",
    )
    notification = session.scalar(
        select(Notification).where(Notification.user_id == user.id)
    )
    notification.is_read = True
    session.commit()

    removed_count = notification_service.cleanup_read_notifications()

    assert removed_count == 1
    assert (
        session.scalar(select(Notification).where(Notification.user_id == user.id))
        is None
    )

    session.close()


def test_run_job_executes_cleanup_notifications_with_db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="jobrouter@example.com",
        username="jobrouter",
        first_name="Job",
        last_name="Router",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    notification_service = NotificationService(session)
    notification_service.create_notification(
        user_id=user.id,
        task_id=None,
        title="Old notification",
        message="to be removed",
    )
    notification = session.scalar(
        select(Notification).where(Notification.user_id == user.id)
    )
    notification.is_read = True
    session.commit()

    result = run_job("cleanup_notifications", db=session, current_user=user)

    assert result == {"status": "queued", "job": "cleanup_notifications"}
    assert (
        session.scalar(select(Notification).where(Notification.user_id == user.id))
        is None
    )

    session.close()
