from datetime import date, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.task import Task
from app.schemas.task_filter import TaskFilterParams
from app.tasks.service import TaskService
from app.users.models import User


def test_task_overview_returns_summary_and_filtered_tasks():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="overview@example.com",
        username="overview",
        first_name="Overview",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Overview", key="OVW", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add_all(
        [
            Task(
                project_id=project.id, title="Alpha", status="todo", created_by=user.id
            ),
            Task(
                project_id=project.id, title="Beta", status="done", created_by=user.id
            ),
        ]
    )
    session.commit()

    service = TaskService(session)
    overview = service.get_task_overview(
        project.id,
        current_user=user,
        filters=TaskFilterParams(status="todo", page=1, size=10),
    )

    assert overview.total_count == 1
    assert overview.summary == "Showing todo tasks"
    assert overview.tasks[0]["title"] == "Alpha"

    session.close()


def test_task_listing_supports_filtering_and_pagination():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="filter@example.com",
        username="filter",
        first_name="Filter",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Filter", key="FLT", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add_all(
        [
            Task(
                project_id=project.id,
                title="First",
                status="todo",
                priority="high",
                created_by=user.id,
            ),
            Task(
                project_id=project.id,
                title="Second",
                status="todo",
                priority="low",
                created_by=user.id,
            ),
            Task(
                project_id=project.id,
                title="Third",
                status="done",
                priority="high",
                created_by=user.id,
            ),
        ]
    )
    session.commit()

    service = TaskService(session)
    filtered = service.get_project_tasks(
        project.id,
        current_user=user,
        filters=TaskFilterParams(status="todo", page=1, size=1),
    )

    assert len(filtered) == 1
    assert filtered[0].title == "Second" or filtered[0].title == "First"

    session.close()


def test_task_listing_supports_search_and_due_date_filters():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="filter2@example.com",
        username="filter2",
        first_name="Filter",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Filter2", key="FLT2", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    due_date = date.today() + timedelta(days=3)
    session.add_all(
        [
            Task(
                project_id=project.id,
                title="Review login flow",
                status="todo",
                priority="high",
                created_by=user.id,
                due_date=due_date,
            ),
            Task(
                project_id=project.id,
                title="Ship release",
                status="todo",
                priority="low",
                created_by=user.id,
                due_date=date.today() - timedelta(days=1),
            ),
        ]
    )
    session.commit()

    service = TaskService(session)
    filtered = service.get_project_tasks(
        project.id,
        current_user=user,
        filters=TaskFilterParams(
            search="login", due_after=date.today(), page=1, size=10
        ),
    )

    assert len(filtered) == 1
    assert filtered[0].title == "Review login flow"

    session.close()


def test_task_listing_supports_sorting():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="sort@example.com",
        username="sort",
        first_name="Sort",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Sort", key="SRT", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add_all(
        [
            Task(
                project_id=project.id,
                title="First",
                status="todo",
                created_by=user.id,
            ),
            Task(
                project_id=project.id,
                title="Second",
                status="todo",
                created_by=user.id,
            ),
        ]
    )
    session.commit()

    service = TaskService(session)
    filtered = service.get_project_tasks(
        project.id,
        current_user=user,
        filters=TaskFilterParams(sort_by="title", sort_order="asc", page=1, size=10),
    )

    assert [item.title for item in filtered] == ["First", "Second"]

    session.close()


def test_task_listing_rejects_unknown_sort_field():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="sort-invalid@example.com",
        username="sortinvalid",
        first_name="Sort",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Sort", key="SRT2", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add(
        Task(project_id=project.id, title="Test", status="todo", created_by=user.id)
    )
    session.commit()

    service = TaskService(session)

    with pytest.raises(HTTPException) as excinfo:
        service.get_project_tasks(
            project.id,
            current_user=user,
            filters=TaskFilterParams(sort_by="unknown", page=1, size=10),
        )

    assert excinfo.value.status_code == 400

    session.close()


def test_task_listing_rejects_unknown_sort_order():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="sort-order-invalid@example.com",
        username="sortorderinvalid",
        first_name="Sort",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Sort", key="SRT3", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add(
        Task(project_id=project.id, title="Test", status="todo", created_by=user.id)
    )
    session.commit()

    service = TaskService(session)

    with pytest.raises(HTTPException) as excinfo:
        service.get_project_tasks(
            project.id,
            current_user=user,
            filters=TaskFilterParams(
                sort_by="title", sort_order="sideways", page=1, size=10
            ),
        )

    assert excinfo.value.status_code == 400

    session.close()
