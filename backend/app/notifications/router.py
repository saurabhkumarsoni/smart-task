from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.notifications.service import NotificationService
from app.schemas.notification import NotificationRead, NotificationSummary
from app.users.models import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    return service.list_notifications(current_user.id)


@router.get("/summary", response_model=NotificationSummary)
def get_notification_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    return service.get_summary(current_user.id)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationRead,
    status_code=status.HTTP_200_OK,
)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    return service.mark_as_read(notification_id, current_user.id)
