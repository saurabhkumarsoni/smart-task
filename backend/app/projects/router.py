from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Response
from fastapi import status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.project_member import ProjectRole
from app.projects.dependencies import require_project_role
from app.users.models import User
from app.projects.service import ProjectService
from app.schemas.project import ProjectCreate
from app.schemas.project import ProjectOverview
from app.schemas.project import ProjectListResponse
from app.schemas.project import ProjectResponse
from app.schemas.project import ProjectUpdate
from app.schemas.project import WorkspaceOverview
from app.schemas.project_member import ProjectMemberCreate
from app.schemas.project_member import ProjectMemberResponse
from app.schemas.project_member import ProjectMemberRoleUpdate

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    service = ProjectService(db)

    return service.create_project(data, current_user)


@router.get(
    "",
    response_model=list[ProjectListResponse],
)
def get_my_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    service = ProjectService(db)

    return service.get_user_projects(current_user)


@router.get(
    "/overview",
    response_model=WorkspaceOverview,
)
def get_workspace_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
    return service.get_workspace_overview(current_user)


@router.get(
    "/{project_id}/overview",
    response_model=ProjectOverview,
)
def get_project_overview(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
    return service.get_project_overview(project_id)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    service = ProjectService(db)

    return service.get_project(project_id)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
            ]
        )
    ),
):

    service = ProjectService(db)

    return service.update_project(project_id, data)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    member=Depends(require_project_role([ProjectRole.OWNER])),
):

    service = ProjectService(db)

    service.delete_project(project_id)

    return Response(status_code=204)


@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_project_member(
    project_id: UUID,
    data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
            ]
        )
    ),
):

    service = ProjectService(db)

    return service.add_member(project_id, data)


@router.get(
    "/{project_id}/members",
    response_model=list[ProjectMemberResponse],
)
def get_project_members(
    project_id: UUID,
    db: Session = Depends(get_db),
    member=Depends(
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

    service = ProjectService(db)

    return service.get_members(project_id)


@router.put(
    "/{project_id}/members/{user_id}",
    response_model=ProjectMemberResponse,
)
def update_member_role(
    project_id: UUID,
    user_id: UUID,
    data: ProjectMemberRoleUpdate,
    db: Session = Depends(get_db),
    member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
            ]
        )
    ),
):

    service = ProjectService(db)

    return service.update_member_role(project_id, user_id, data)


@router.delete(
    "/{project_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    member=Depends(
        require_project_role(
            [
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
            ]
        )
    ),
):

    service = ProjectService(db)

    service.remove_member(project_id, user_id)

    return Response(status_code=204)
