import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )
    description: str | None = None

    status: str = Field(
        default="todo",
    )

    priority: str = Field(
        default="medium",
    )

    assignee_id: uuid.UUID | None = None

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

    assignee_id: uuid.UUID | None = None

    due_date: date | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str | None
    status: str
    priority: str
    assignee_id: uuid.UUID | None
    created_by: uuid.UUID
    due_date: date | None
    created_at: datetime
    updated_at: datetime


TaskRead = TaskResponse
