from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.projects.service import ProjectService
from app.users.models import User


def test_get_members_returns_user_details():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="member@example.com",
        username="memberuser",
        first_name="Member",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Roster", key="RST", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    session.add(
        ProjectMember(project_id=project.id, user_id=user.id, role=ProjectRole.OWNER)
    )
    session.commit()

    service = ProjectService(session)
    members = service.get_members(project.id)

    assert len(members) == 1
    assert members[0].user_name == "Member User"
    assert members[0].user_email == "member@example.com"

    session.close()
