from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    status: str = "todo"
    priority: str = "medium"
    assignee_id: UUID | None = None
    sprint_id: UUID | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: UUID | None = None
    sprint_id: UUID | None = None
    due_date: date | None = None


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str
    description: str | None
    status: str
    priority: str
    assignee_id: UUID | None
    sprint_id: UUID | None
    created_by: UUID
    due_date: date | None
    created_at: datetime
    updated_at: datetime
