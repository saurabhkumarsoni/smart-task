import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TaskHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    changed_by: uuid.UUID | None
    previous_status: str | None
    new_status: str | None
    action: str
    created_at: datetime
    summary: str
    changed_by_name: str | None = None
