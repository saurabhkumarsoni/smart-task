from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.project_member import ProjectRole
from app.projects.dependencies import require_project_role
from app.schemas.comment import CommentCreate, CommentRead, CommentUpdate
from app.comments.service import CommentService
from app.users.models import User

router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/comments", tags=["comments"]
)


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    project_id: UUID,
    task_id: UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ]
        )
    ),
):
    service = CommentService(db)
    return service.create_comment(project_id, task_id, data, current_user)


@router.get("", response_model=list[CommentRead])
def list_comments(
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ]
        )
    ),
):
    service = CommentService(db)
    return service.list_comments(project_id, task_id, current_user)


@router.patch("/{comment_id}", response_model=CommentRead)
def update_comment(
    project_id: UUID,
    task_id: UUID,
    comment_id: UUID,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ]
        )
    ),
):
    service = CommentService(db)
    return service.update_comment(project_id, task_id, comment_id, data, current_user)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    project_id: UUID,
    task_id: UUID,
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ]
        )
    ),
):
    service = CommentService(db)
    service.delete_comment(project_id, task_id, comment_id, current_user)
    return None
