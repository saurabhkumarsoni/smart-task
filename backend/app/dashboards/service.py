from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.task_history import TaskHistory


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_project_summary(self, project_id: UUID) -> dict:
        project = self.db.scalar(select(Project).where(Project.id == project_id))
        if not project:
            raise ValueError("Project not found")

        tasks = list(
            self.db.scalars(select(Task).where(Task.project_id == project_id)).all()
        )
        total = len(tasks)
        done_count = sum(1 for task in tasks if task.status == "done")
        todo_count = sum(1 for task in tasks if task.status == "todo")
        in_progress_count = sum(1 for task in tasks if task.status == "in_progress")
        overdue_count = sum(
            1 for task in tasks if task.due_date and task.due_date < date.today()
        )
        completion_rate = round((done_count / total * 100) if total else 0.0, 2)

        upcoming_deadlines = [
            {
                "id": task.id,
                "title": task.title,
                "due_date": task.due_date,
            }
            for task in sorted(
                (task for task in tasks if task.due_date),
                key=lambda task: task.due_date,
            )
            if task.due_date and task.due_date <= date.today() + timedelta(days=7)
        ]

        recent_activity = []
        history_entries = list(
            self.db.scalars(
                select(TaskHistory)
                .join(Task, TaskHistory.task_id == Task.id)
                .where(Task.project_id == project_id)
                .order_by(TaskHistory.created_at.desc())
                .limit(5)
            ).all()
        )

        for entry in history_entries:
            recent_activity.append(
                {
                    "id": entry.id,
                    "task_id": entry.task_id,
                    "action": entry.action,
                    "summary": (
                        "Created the task"
                        if entry.action == "created"
                        else f"Moved from {entry.previous_status} to {entry.new_status}"
                    ),
                    "created_at": entry.created_at,
                }
            )

        return {
            "project_id": project.id,
            "project_name": project.name,
            "total_tasks": total,
            "todo_count": todo_count,
            "in_progress_count": in_progress_count,
            "done_count": done_count,
            "overdue_count": overdue_count,
            "completion_rate": completion_rate,
            "upcoming_deadlines": upcoming_deadlines,
            "recent_activity": recent_activity,
        }
