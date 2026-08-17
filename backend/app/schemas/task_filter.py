from datetime import date

from pydantic import BaseModel, Field


class TaskFilterParams(BaseModel):
    status: str | None = None
    priority: str | None = None
    assignee_id: str | None = None
    sprint_id: str | None = None
    search: str | None = None
    due_before: date | None = None
    due_after: date | None = None
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)


class TaskOverview(BaseModel):
    total_count: int
    page: int
    size: int
    summary: str
    tasks: list[dict]
