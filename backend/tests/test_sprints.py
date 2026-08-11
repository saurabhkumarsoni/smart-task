from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.sprint import Sprint
from app.models.task import Task
from app.sprints.service import SprintService
from app.users.models import User


def test_create_sprint_and_assign_tasks():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="sprint@example.com",
        username="sprintuser",
        first_name="Sprint",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(
        name="Sprint Project", key="SPR", description="Test", owner_id=user.id
    )
    session.add(project)
    session.flush()

    service = SprintService(session)
    sprint = service.create_sprint(
        project_id=project.id,
        data={
            "name": "Sprint 1",
            "goal": "Launch",
            "start_date": "2026-08-01",
            "end_date": "2026-08-15",
        },
        current_user=user,
    )

    task = Task(project_id=project.id, title="Ship", status="todo", created_by=user.id)
    session.add(task)
    session.flush()
    service.assign_task_to_sprint(sprint.id, task.id)

    sprint_tasks = service.get_sprint_tasks(sprint.id)

    assert sprint.name == "Sprint 1"
    assert len(sprint_tasks) == 1
    assert sprint_tasks[0].id == task.id

    session.close()
