from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.organization_member import OrganizationRole


class OrganizationMemberCreate(BaseModel):
    user_id: UUID
    role: OrganizationRole = OrganizationRole.MEMBER


class OrganizationMemberRoleUpdate(BaseModel):
    role: OrganizationRole


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    joined_at: datetime
