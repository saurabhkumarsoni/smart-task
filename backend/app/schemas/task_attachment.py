from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TaskAttachmentCreate(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    content_type: str | None = None
    size_bytes: int | None = None
    notes: str | None = None


class TaskAttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    file_name: str
    content_type: str | None
    size_bytes: int | None
    uploaded_by: UUID | None
    created_at: datetime
    notes: str | None
