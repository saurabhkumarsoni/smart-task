from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.project import Project
from app.models.task import Task
from app.tasks.service import TaskService
from app.users.models import User
from app.comments.service import CommentService


def test_create_and_list_task_comments():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    session = Session(bind=engine)

    user = User(
        email="commenter@example.com",
        username="commenter",
        first_name="Comment",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    project = Project(name="Comments", key="CMT", description="Test", owner_id=user.id)
    session.add(project)
    session.flush()

    task = Task(
        project_id=project.id,
        title="Commented task",
        description="Needs discussion",
        status="todo",
        created_by=user.id,
    )
    session.add(task)
    session.flush()

    task_service = TaskService(session)
    comment_service = CommentService(session)

    comment = comment_service.create_comment(
        project_id=project.id,
        task_id=task.id,
        data={"content": "Looks good"},
        current_user=user,
    )

    comments = comment_service.list_comments(
        project_id=project.id, task_id=task.id, current_user=user
    )

    assert comment.content == "Looks good"
    assert comment.author_id == user.id
    assert len(comments) == 1
    assert comments[0].content == "Looks good"

    session.close()
