from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

SearchType = Literal["person", "project", "task"]


class SearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: SearchType
    title: str
    subtitle: str | None = None
    description: str | None = None
    url: str
    avatar_url: str | None = None
    meta: str | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total: int
