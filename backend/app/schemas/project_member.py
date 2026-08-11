from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict

from app.models.project_member import ProjectRole


class ProjectMemberCreate(BaseModel):
    user_id: UUID
    role: ProjectRole = ProjectRole.MEMBER


class ProjectMemberRoleUpdate(BaseModel):
    role: ProjectRole


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    role: ProjectRole
    joined_at: datetime
    user_name: str | None = None
    user_email: str | None = None
