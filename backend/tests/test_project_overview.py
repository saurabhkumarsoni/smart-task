from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.models.task import Task
from app.projects.service import ProjectService
from app.users.models import User


def test_project_overview_returns_summary_metrics():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="overviewproj@example.com",
        username="overviewproj",
        first_name="Project",
        last_name="Overview",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Overview", key="OVW", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add(
        ProjectMember(project_id=project.id, user_id=user.id, role=ProjectRole.OWNER)
    )
    session.add_all(
        [
            Task(
                project_id=project.id, title="Open", status="todo", created_by=user.id
            ),
            Task(
                project_id=project.id,
                title="In progress",
                status="in_progress",
                created_by=user.id,
            ),
            Task(
                project_id=project.id, title="Done", status="done", created_by=user.id
            ),
        ]
    )
    session.commit()

    service = ProjectService(session)
    overview = service.get_project_overview(project.id)

    assert overview.total_tasks == 3
    assert overview.completed_tasks == 1
    assert overview.active_tasks == 2
    assert overview.member_count == 1
    assert "completed" in overview.summary

    session.close()
