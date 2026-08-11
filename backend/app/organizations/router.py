from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.organizations.service import OrganizationService
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.schemas.organization_member import (
    OrganizationMemberCreate,
    OrganizationMemberResponse,
    OrganizationMemberRoleUpdate,
)
from app.users.models import User

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post(
    "", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED
)
def create_organization(
    data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizationService(db)
    return service.create_organization(data, current_user)


@router.get("", response_model=list[OrganizationResponse])
def get_my_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizationService(db)
    return service.get_user_organizations(current_user)


@router.put("/{organization_id}", response_model=OrganizationResponse)
def update_organization(
    organization_id: UUID,
    data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizationService(db)
    return service.update_organization(organization_id, data)


@router.post(
    "/{organization_id}/members",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_organization_member(
    organization_id: UUID,
    data: OrganizationMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizationService(db)
    return service.add_member(organization_id, data)


@router.get(
    "/{organization_id}/members", response_model=list[OrganizationMemberResponse]
)
def get_organization_members(
    organization_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizationService(db)
    return service.get_members(organization_id)


@router.put(
    "/{organization_id}/members/{user_id}", response_model=OrganizationMemberResponse
)
def update_organization_member_role(
    organization_id: UUID,
    user_id: UUID,
    data: OrganizationMemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizationService(db)
    return service.update_member_role(organization_id, user_id, data)
