import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.models.task import Task
from app.tasks.router import router as task_router
from app.tasks.service import TaskService
from app.comments.service import CommentService
from app.users.models import User


def test_create_task_assigns_project_and_creator():
    engine = create_engine("sqlite:///:memory:")
    from app.database import Base

    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="tester@example.com",
        username="tester",
        first_name="Test",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(
        name="Smart Task",
        key="STM",
        description="Demo",
        owner_id=user.id,
    )
    session.add(project)
    session.flush()

    service = TaskService(session)
    task = service.create_task(
        project_id=project.id,
        data={
            "title": "Write API",
            "description": "Create endpoints",
            "status": "todo",
            "priority": "high",
        },
        current_user=user,
    )

    assert task.project_id == project.id
    assert task.created_by == user.id
    assert task.title == "Write API"
    assert task.status == "todo"

    session.close()


def test_task_routes_require_project_role_dependency():
    post_route = next(
        route
        for route in task_router.routes
        if getattr(route, "methods", None) == {"POST"}
    )

    dependency_names = [
        dependency.call.__name__ for dependency in post_route.dependant.dependencies
    ]

    assert "dependency" in dependency_names


def test_task_routes_are_protected_by_project_role_dependency():
    create_route = next(
        route
        for route in task_router.routes
        if getattr(route, "path", "") == "/projects/{project_id}/tasks"
        and "POST" in getattr(route, "methods", set())
    )

    dependency_names = [
        dependency.call.__name__ for dependency in create_route.dependant.dependencies
    ]

    assert "dependency" in dependency_names


def test_update_task_route_injects_current_user_dependency():
    update_route = next(
        route
        for route in task_router.routes
        if getattr(route, "path", "") == "/projects/{project_id}/tasks/{task_id}"
        and "PATCH" in getattr(route, "methods", set())
    )

    dependency_names = [
        dependency.call.__name__ for dependency in update_route.dependant.dependencies
    ]

    assert "get_current_user" in dependency_names


def test_task_service_enforces_project_role_permissions():
    engine = create_engine("sqlite:///:memory:")
    from app.database import Base

    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    owner = User(
        email="owner@example.com",
        username="owner",
        first_name="Owner",
        last_name="User",
        password_hash="hash",
    )
    session.add(owner)
    session.flush()

    viewer = User(
        email="viewer@example.com",
        username="viewer",
        first_name="Viewer",
        last_name="User",
        password_hash="hash",
    )
    session.add(viewer)
    session.flush()

    project = Project(name="RBAC", key="RBC", description="Test", owner_id=owner.id)
    session.add(project)
    session.flush()

    session.add(
        ProjectMember(project_id=project.id, user_id=owner.id, role=ProjectRole.OWNER)
    )
    session.add(
        ProjectMember(project_id=project.id, user_id=viewer.id, role=ProjectRole.VIEWER)
    )
    session.flush()

    service = TaskService(session)
    task = service.create_task(
        project_id=project.id,
        data={"title": "Owned task", "status": "todo"},
        current_user=owner,
    )

    readable_task = service.get_task(
        project.id,
        task.id,
        current_user=viewer,
        allowed_roles=(
            ProjectRole.OWNER,
            ProjectRole.ADMIN,
            ProjectRole.MEMBER,
            ProjectRole.VIEWER,
        ),
    )
    assert readable_task.id == task.id

    with pytest.raises(HTTPException) as excinfo:
        service.create_task(
            project_id=project.id,
            data={"title": "Forbidden task", "status": "todo"},
            current_user=viewer,
        )

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "You do not have permission for this action"

    session.close()
    engine = create_engine("sqlite:///:memory:")
    from app.database import Base

    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="workflow@example.com",
        username="workflow",
        first_name="Workflow",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Workflow", key="WRK", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    service = TaskService(session)
    task = service.create_task(
        project_id=project.id,
        data={"title": "Workflow task", "status": "todo"},
        current_user=user,
    )

    updated_task = service.update_task(
        project_id=project.id,
        task_id=task.id,
        data={"status": "in_progress"},
    )
    assert updated_task.status == "in_progress"

    updated_task = service.update_task(
        project_id=project.id,
        task_id=task.id,
        data={"status": "in_review"},
    )
    assert updated_task.status == "in_review"

    updated_task = service.update_task(
        project_id=project.id,
        task_id=task.id,
        data={"status": "done"},
    )
    assert updated_task.status == "done"

    session.close()


def test_update_task_rejects_invalid_status_transition():
    engine = create_engine("sqlite:///:memory:")
    from app.database import Base

    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="invalid@example.com",
        username="invalid",
        first_name="Invalid",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Invalid", key="INV", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    service = TaskService(session)
    task = service.create_task(
        project_id=project.id,
        data={"title": "Bad transition", "status": "todo"},
        current_user=user,
    )

    with pytest.raises(HTTPException) as excinfo:
        service.update_task(
            project_id=project.id,
            task_id=task.id,
            data={"status": "done"},
        )

    assert excinfo.value.status_code == 400
    assert excinfo.value.detail == "Invalid task status transition: todo -> done"

    session.close()
