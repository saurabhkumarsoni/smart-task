import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=2000)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime
    updated_at: datetime
