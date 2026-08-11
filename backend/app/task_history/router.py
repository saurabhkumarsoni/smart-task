from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.project_member import ProjectRole
from app.projects.dependencies import require_project_role
from app.schemas.task_history import TaskHistoryRead
from app.task_history.service import TaskHistoryService
from app.users.models import User

router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/history", tags=["task-history"]
)


@router.get("", response_model=list[TaskHistoryRead], status_code=status.HTTP_200_OK)
def list_history(
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
    service = TaskHistoryService(db)
    entries = service.build_activity_feed(task_id)
    return entries
