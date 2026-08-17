from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.organization import Organization
from app.models.organization_member import (
    OrganizationMember,
    OrganizationRole,
)
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
)
from app.schemas.organization_member import (
    OrganizationMemberCreate,
    OrganizationMemberRoleUpdate,
)
from app.users.models import User


class OrganizationService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Organizations
    # ------------------------------------------------------------------

    def create_organization(
        self,
        data: OrganizationCreate | dict,
        current_user: User,
    ):
        payload = data if isinstance(data, dict) else data.model_dump()

        existing = self.db.scalar(
            select(Organization).where(Organization.slug == payload["slug"].lower())
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Organization slug already exists",
            )

        org = Organization(
            name=payload["name"],
            slug=payload["slug"].lower(),
            description=payload.get("description"),
        )

        self.db.add(org)
        self.db.flush()

        owner_member = OrganizationMember(
            organization_id=org.id,
            user_id=current_user.id,
            role=OrganizationRole.OWNER,
        )

        self.db.add(owner_member)

        self.db.commit()
        self.db.refresh(org)

        return org

    def get_user_organizations(
        self,
        current_user: User,
    ):
        query = (
            select(Organization)
            .join(
                OrganizationMember,
                OrganizationMember.organization_id == Organization.id,
            )
            .where(
                OrganizationMember.user_id == current_user.id,
                Organization.is_active.is_(True),
            )
            .order_by(Organization.created_at.desc())
        )

        return list(self.db.scalars(query).all())

    def get_organization(
        self,
        organization_id: UUID,
    ):
        org = self.db.scalar(
            select(Organization).where(Organization.id == organization_id)
        )

        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )

        return org

    def update_organization(
        self,
        organization_id: UUID,
        data: OrganizationUpdate | dict,
    ):
        org = self.get_organization(organization_id)

        payload = (
            data if isinstance(data, dict) else data.model_dump(exclude_unset=True)
        )

        if "name" in payload and payload["name"] is not None:
            org.name = payload["name"]

        if "description" in payload and payload["description"] is not None:
            org.description = payload["description"]

        if "is_active" in payload and payload["is_active"] is not None:
            org.is_active = payload["is_active"]

        self.db.commit()
        self.db.refresh(org)

        return org

    # ------------------------------------------------------------------
    # Members
    # ------------------------------------------------------------------

    def add_member(
        self,
        organization_id: UUID,
        data: OrganizationMemberCreate | dict,
    ):
        self.get_organization(organization_id)

        payload = data if isinstance(data, dict) else data.model_dump()

        user = self.db.scalar(select(User).where(User.id == payload["user_id"]))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        existing_member = self.db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == payload["user_id"],
            )
        )

        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already an organization member",
            )

        member = OrganizationMember(
            organization_id=organization_id,
            user_id=payload["user_id"],
            role=payload.get(
                "role",
                OrganizationRole.MEMBER,
            ),
        )

        self.db.add(member)
        self.db.commit()

        # Reload with user relationship.
        member = self.db.scalar(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.user))
            .where(OrganizationMember.id == member.id)
        )

        return member

    def get_members(
        self,
        organization_id: UUID,
    ):
        self.get_organization(organization_id)

        query = (
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.user))
            .where(OrganizationMember.organization_id == organization_id)
            .order_by(OrganizationMember.joined_at.asc())
        )

        return list(self.db.scalars(query).all())

    def update_member_role(
        self,
        organization_id: UUID,
        user_id: UUID,
        data: OrganizationMemberRoleUpdate | dict,
    ):
        payload = data if isinstance(data, dict) else data.model_dump()

        member = self.db.scalar(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.user))
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
            )
        )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization member not found",
            )

        if member.role == OrganizationRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization owner role cannot be changed",
            )

        member.role = payload["role"]

        self.db.commit()
        self.db.refresh(member)

        # Make sure nested user is available after refresh.
        member = self.db.scalar(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.user))
            .where(OrganizationMember.id == member.id)
        )

        return member
