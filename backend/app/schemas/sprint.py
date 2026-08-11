from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SprintCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class SprintUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class SprintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    goal: str | None
    start_date: date | None
    end_date: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
