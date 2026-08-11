from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.project_member import ProjectRole
from app.models.task import Task
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentRead, CommentUpdate
from app.tasks.service import TaskService
from app.users.models import User


class CommentService:
    def __init__(self, db: Session):
        self.db = db

    def _get_task_or_404(self, project_id: UUID, task_id: UUID) -> Task:
        task_service = TaskService(self.db)
        task = task_service.get_task(
            project_id,
            task_id,
            current_user=None,
            allowed_roles=(
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ),
        )
        return task

    def create_comment(
        self,
        project_id: UUID,
        task_id: UUID,
        data: CommentCreate | dict,
        current_user: User,
    ) -> Comment:
        self._get_task_or_404(project_id, task_id)

        if isinstance(data, dict):
            payload = data
        else:
            payload = data.model_dump()

        comment = Comment(
            task_id=task_id,
            author_id=current_user.id,
            content=payload["content"],
        )

        self.db.add(comment)
        try:
            self.db.commit()
            self.db.refresh(comment)
            return comment
        except ProgrammingError:
            self.db.rollback()
            return None

    def list_comments(
        self, project_id: UUID, task_id: UUID, current_user: User
    ) -> list[Comment]:
        self._get_task_or_404(project_id, task_id)
        query = (
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at.asc())
        )
        return list(self.db.scalars(query).all())

    def update_comment(
        self,
        project_id: UUID,
        task_id: UUID,
        comment_id: UUID,
        data: CommentUpdate | dict,
        current_user: User,
    ) -> Comment:
        self._get_task_or_404(project_id, task_id)
        comment = self.db.scalar(
            select(Comment).where(Comment.id == comment_id, Comment.task_id == task_id)
        )
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
            )
        if comment.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own comments",
            )

        if isinstance(data, dict):
            payload = data
        else:
            payload = data.model_dump(exclude_unset=True)

        for field, value in payload.items():
            if value is not None:
                setattr(comment, field, value)

        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete_comment(
        self,
        project_id: UUID,
        task_id: UUID,
        comment_id: UUID,
        current_user: User,
    ) -> None:
        self._get_task_or_404(project_id, task_id)
        comment = self.db.scalar(
            select(Comment).where(Comment.id == comment_id, Comment.task_id == task_id)
        )
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
            )
        if comment.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own comments",
            )

        self.db.delete(comment)
        self.db.commit()
