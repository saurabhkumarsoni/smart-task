from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.task_history import TaskHistory
from app.users.models import User
from app.users.models import User


class TaskHistoryService:
    def __init__(self, db: Session):
        self.db = db

    def create_history_entry(
        self,
        task_id: UUID,
        previous_status: str | None,
        new_status: str | None,
        changed_by: User | None = None,
        action: str = "updated",
    ) -> TaskHistory | None:
        history = TaskHistory(
            task_id=task_id,
            changed_by=changed_by.id if changed_by else None,
            previous_status=previous_status,
            new_status=new_status,
            action=action,
        )
        self.db.add(history)
        try:
            self.db.commit()
            self.db.refresh(history)
            return history
        except ProgrammingError:
            self.db.rollback()
            return None

    def list_history(self, task_id: UUID) -> list[TaskHistory]:
        query = (
            select(TaskHistory)
            .where(TaskHistory.task_id == task_id)
            .order_by(TaskHistory.created_at.desc())
        )
        return list(self.db.scalars(query).all())

    def get_activity_feed(self, task_id: UUID) -> list[dict]:
        entries = self.list_history(task_id)
        return [
            {
                "id": entry.id,
                "task_id": entry.task_id,
                "action": entry.action,
                "previous_status": entry.previous_status,
                "new_status": entry.new_status,
                "changed_by": entry.changed_by,
                "created_at": entry.created_at,
            }
            for entry in entries
        ]

    def build_activity_feed(self, task_id: UUID) -> list[dict]:
        entries = self.list_history(task_id)
        feed = []
        for entry in entries:
            changed_by_user = None
            if entry.changed_by:
                changed_by_user = self.db.get(User, entry.changed_by)

            if entry.action == "created":
                summary = "Created the task"
            elif entry.previous_status and entry.new_status:
                summary = f"Moved from {entry.previous_status} to {entry.new_status}"
            else:
                summary = entry.action.replace("_", " ").title()

            if changed_by_user:
                summary = f"{changed_by_user.first_name or changed_by_user.username} {summary.lower()}"

            feed.append(
                {
                    "id": entry.id,
                    "task_id": entry.task_id,
                    "changed_by": entry.changed_by,
                    "previous_status": entry.previous_status,
                    "new_status": entry.new_status,
                    "action": entry.action,
                    "created_at": entry.created_at,
                    "summary": summary,
                    "changed_by_name": (
                        f"{changed_by_user.first_name} {changed_by_user.last_name}".strip()
                        if changed_by_user
                        else None
                    ),
                }
            )
        return feed
