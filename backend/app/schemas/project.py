from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    key: str = Field(..., min_length=2, max_length=10)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    key: str
    description: str | None
    owner_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProjectOverview(BaseModel):
    project_id: UUID
    project_name: str
    total_tasks: int
    completed_tasks: int
    active_tasks: int
    member_count: int
    summary: str


class WorkspaceOverview(BaseModel):
    project_count: int
    total_tasks: int
    completed_tasks: int
    active_tasks: int
    summary: str
