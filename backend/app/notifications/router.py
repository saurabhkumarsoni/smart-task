import uuid
from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import decode_token
from app.database import SessionLocal, get_db
from app.notifications.manager import notification_manager
from app.notifications.service import NotificationService
from app.schemas.notification import NotificationRead, NotificationSummary
from app.users.models import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationService(db).list_notifications(current_user.id)


@router.get("/summary", response_model=NotificationSummary)
def get_notification_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationService(db).get_summary(current_user.id)


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationService(db).mark_as_read(notification_id, current_user.id)


@router.post("/read-all", response_model=dict[str, int])
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = NotificationService(db).mark_all_as_read(current_user.id)
    return {"updated_count": count}


@router.websocket("/ws")
async def notification_websocket(
    websocket: WebSocket,
    token: str = Query(..., min_length=1),
):
    """Authenticated real-time notification channel.

    The browser supplies the short-lived access JWT as a query parameter because
    the native WebSocket API cannot attach an Authorization header portably.
    """
    db = SessionLocal()
    user: User | None = None

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        raw_user_id = payload.get("sub")
        if not raw_user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        try:
            user_id = uuid.UUID(raw_user_id)
        except ValueError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user = db.scalar(select(User).where(User.id == user_id))
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await notification_manager.connect(user.id, websocket)
        await websocket.send_json({"type": "notification.connected"})

        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"type": "pong"})
    except (WebSocketDisconnect, jwt.PyJWTError):
        pass
    finally:
        if user:
            await notification_manager.disconnect(user.id, websocket)
        db.close()
