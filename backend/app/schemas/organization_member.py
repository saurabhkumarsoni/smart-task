from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.organization_member import OrganizationRole


class OrganizationMemberCreate(BaseModel):
    user_id: UUID
    role: OrganizationRole = OrganizationRole.MEMBER


class OrganizationMemberRoleUpdate(BaseModel):
    role: OrganizationRole


class OrganizationMemberUserResponse(BaseModel):
    """
    Safe public representation of a user inside an organization.

    IMPORTANT:
    Never expose password_hash, authentication tokens,
    reset tokens, or other security-sensitive fields here.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    is_active: bool
    is_verified: bool

    @property
    def display_name(self) -> str:
        full_name = " ".join(
            part
            for part in [self.first_name, self.last_name]
            if part
        ).strip()

        return full_name or self.username


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    joined_at: datetime

    user: OrganizationMemberUserResponse