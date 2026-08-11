from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.task import Task


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self, user_id: UUID, task_id: UUID | None, title: str, message: str
    ) -> Notification | None:
        notification = Notification(
            user_id=user_id,
            task_id=task_id,
            title=title,
            message=message,
        )
        self.db.add(notification)
        try:
            self.db.commit()
            self.db.refresh(notification)
            return notification
        except ProgrammingError:
            self.db.rollback()
            return None

    def list_notifications(self, user_id: UUID) -> list[Notification]:
        query = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        return list(self.db.scalars(query).all())

    def mark_as_read(self, notification_id: UUID, user_id: UUID) -> Notification:
        notification = self.db.scalar(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        if not notification:
            raise ValueError("Notification not found")

        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_summary(self, user_id: UUID) -> dict:
        notifications = self.list_notifications(user_id)
        unread_count = sum(
            1 for notification in notifications if not notification.is_read
        )
        total_count = len(notifications)

        summary_items = []
        for notification in notifications[:3]:
            label = notification.title
            if notification.task_id:
                task = self.db.scalar(
                    select(Task).where(Task.id == notification.task_id)
                )
                if task:
                    label = f"{notification.title} for {task.title}"
            summary_items.append(label)

        if unread_count == 0:
            digest = "You have no unread notifications"
        elif unread_count == 1:
            digest = f"You have 1 unread notification: {', '.join(summary_items)}"
        else:
            digest = (
                f"You have {unread_count} unread notifications: "
                f"{', '.join(summary_items)}"
            )

        return {
            "unread_count": unread_count,
            "total_count": total_count,
            "digest": digest,
        }

    def cleanup_read_notifications(self) -> int:
        query = select(Notification).where(Notification.is_read.is_(True))
        notifications = list(self.db.scalars(query).all())
        for notification in notifications:
            self.db.delete(notification)
        self.db.commit()
        return len(notifications)
