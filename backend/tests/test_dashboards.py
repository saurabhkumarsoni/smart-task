from datetime import date, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.task import Task
from app.models.task_history import TaskHistory
from app.dashboards.service import DashboardService
from app.users.models import User


def test_dashboard_returns_summary_and_overdue_tasks():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="dashboard@example.com",
        username="dashboarduser",
        first_name="Dash",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Dash", key="DASH", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add_all(
        [
            Task(
                project_id=project.id,
                title="Open task",
                status="todo",
                created_by=user.id,
            ),
            Task(
                project_id=project.id,
                title="In progress",
                status="in_progress",
                created_by=user.id,
            ),
            Task(
                project_id=project.id,
                title="Done task",
                status="done",
                created_by=user.id,
            ),
            Task(
                project_id=project.id,
                title="Overdue",
                status="todo",
                created_by=user.id,
                due_date=date.today() - timedelta(days=1),
            ),
        ]
    )
    session.commit()

    task = session.query(Task).filter(Task.title == "Open task").first()
    session.add(
        TaskHistory(
            task_id=task.id,
            action="created",
            previous_status=None,
            new_status="todo",
            changed_by=user.id,
        )
    )
    session.commit()

    service = DashboardService(session)
    summary = service.get_project_summary(project.id)

    assert summary["total_tasks"] == 4
    assert summary["todo_count"] == 2
    assert summary["done_count"] == 1
    assert summary["overdue_count"] == 1
    assert summary["completion_rate"] == 25.0
    assert summary["upcoming_deadlines"][0]["title"] == "Overdue"
    assert summary["recent_activity"][0]["summary"] == "Created the task"

    session.close()


def test_dashboard_includes_upcoming_deadlines_from_next_week():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="deadline@example.com",
        username="deadlineuser",
        first_name="Dead",
        last_name="Line",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Deadlines", key="DLN", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add_all(
        [
            Task(
                project_id=project.id,
                title="Next week",
                status="todo",
                created_by=user.id,
                due_date=date.today() + timedelta(days=3),
            ),
            Task(
                project_id=project.id,
                title="Far future",
                status="todo",
                created_by=user.id,
                due_date=date.today() + timedelta(days=20),
            ),
        ]
    )
    session.commit()

    service = DashboardService(session)
    summary = service.get_project_summary(project.id)

    assert len(summary["upcoming_deadlines"]) == 1
    assert summary["upcoming_deadlines"][0]["title"] == "Next week"

    session.close()
