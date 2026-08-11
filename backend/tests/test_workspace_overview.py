from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.models.task import Task
from app.projects.service import ProjectService
from app.users.models import User


def test_workspace_overview_returns_aggregate_metrics():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="workspace@example.com",
        username="workspace",
        first_name="Work",
        last_name="Space",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    first_project = Project(name="One", key="ONE", description="Test", owner_id=user.id)
    second_project = Project(
        name="Two", key="TWO", description="Test", owner_id=user.id
    )
    session.add_all([first_project, second_project])
    session.flush()

    session.add(
        ProjectMember(
            project_id=first_project.id, user_id=user.id, role=ProjectRole.OWNER
        )
    )
    session.add(
        ProjectMember(
            project_id=second_project.id, user_id=user.id, role=ProjectRole.MEMBER
        )
    )
    session.add_all(
        [
            Task(
                project_id=first_project.id,
                title="Open",
                status="todo",
                created_by=user.id,
            ),
            Task(
                project_id=second_project.id,
                title="Done",
                status="done",
                created_by=user.id,
            ),
        ]
    )
    session.commit()

    service = ProjectService(session)
    overview = service.get_workspace_overview(user)

    assert overview.project_count == 2
    assert overview.total_tasks == 2
    assert overview.completed_tasks == 1
    assert overview.active_tasks == 1
    assert "projects" in overview.summary

    session.close()
