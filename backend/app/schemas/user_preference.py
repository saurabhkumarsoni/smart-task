from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    email_notifications: bool
    desktop_notifications: bool
    task_assignments: bool
    mentions: bool
    weekly_digest: bool
    compact_mode: bool
    updated_at: datetime


class UserPreferenceUpdate(BaseModel):
    email_notifications: bool | None = None
    desktop_notifications: bool | None = None
    task_assignments: bool | None = None
    mentions: bool | None = None
    weekly_digest: bool | None = None
    compact_mode: bool | None = None
