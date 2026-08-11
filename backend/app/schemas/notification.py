import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    task_id: uuid.UUID | None
    title: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationSummary(BaseModel):
    unread_count: int
    total_count: int
    digest: str
