from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.search.schemas import SearchResponse
from app.search.service import SearchService
from app.users.models import User

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(default=8, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SearchService(db).search(
        current_user=current_user,
        query=q,
        limit=limit,
    )
