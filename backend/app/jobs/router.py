from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.jobs.service import JobService
from app.notifications.service import NotificationService
from app.users.models import User

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/run", status_code=status.HTTP_202_ACCEPTED)
def run_job(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = JobService()

    def cleanup_notifications(session: Session) -> None:
        notification_service = NotificationService(session)
        notification_service.cleanup_read_notifications()

    service.register("healthcheck", lambda: None)
    service.register("cleanup_notifications", cleanup_notifications)

    try:
        service.enqueue(name, db)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    service.run_pending()
    return {"status": "queued", "job": name}
