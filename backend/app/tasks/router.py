from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project_member import ProjectRole
from app.projects.dependencies import require_project_role
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.schemas.task_filter import TaskFilterParams
from app.schemas.task_filter import TaskOverview
from app.tasks.service import TaskService
from app.users.models import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: UUID,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(
        require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER])
    ),
):
    service = TaskService(db)
    return service.create_task(
        project_id,
        data,
        current_user,
        allowed_roles=(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER),
    )


@router.get("", response_model=list[TaskRead])
def list_tasks(
    project_id: UUID,
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    assignee_id: UUID | None = Query(default=None),
    sprint_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    due_before: date | None = Query(default=None),
    due_after: date | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
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
    service = TaskService(db)
    return service.get_project_tasks(
        project_id,
        current_user=None,
        allowed_roles=(
            ProjectRole.OWNER,
            ProjectRole.ADMIN,
            ProjectRole.MEMBER,
            ProjectRole.VIEWER,
        ),
        filters=TaskFilterParams(
            status=status,
            priority=priority,
            assignee_id=str(assignee_id) if assignee_id else None,
            search=search,
            due_before=due_before,
            due_after=due_after,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            size=size,
        ),
    )


@router.get("/overview", response_model=TaskOverview)
def get_task_overview(
    project_id: UUID,
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    assignee_id: UUID | None = Query(default=None),
    sprint_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    due_before: date | None = Query(default=None),
    due_after: date | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
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
    service = TaskService(db)
    return service.get_task_overview(
        project_id,
        current_user=current_user,
        allowed_roles=(
            ProjectRole.OWNER,
            ProjectRole.ADMIN,
            ProjectRole.MEMBER,
            ProjectRole.VIEWER,
        ),
        filters=TaskFilterParams(
            status=status,
            priority=priority,
            assignee_id=str(assignee_id) if assignee_id else None,
            search=search,
            due_before=due_before,
            due_after=due_after,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            size=size,
        ),
    )


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
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
    service = TaskService(db)
    return service.get_task(
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


@router.get("/{task_id}/detail")
def get_task_detail(
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
    service = TaskService(db)
    return service.get_task_detail(project_id, task_id, current_user)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    project_id: UUID,
    task_id: UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(
        require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER])
    ),
):
    service = TaskService(db)
    return service.update_task(
        project_id,
        task_id,
        data,
        current_user=current_user,
        allowed_roles=(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER),
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN])),
):
    service = TaskService(db)
    service.delete_task(
        project_id,
        task_id,
        current_user=current_user,
        allowed_roles=(ProjectRole.OWNER, ProjectRole.ADMIN),
    )
    return None
