from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.project import Project
from app.models.task import Task
from app.models.task_history import TaskHistory
from app.models.sprint import Sprint


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_project_summary(self, project_id: UUID) -> dict:
        from app.models.project_member import ProjectMember
        from app.users.models import User

        project = self.db.scalar(select(Project).where(Project.id == project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        tasks = list(
            self.db.scalars(select(Task).where(Task.project_id == project_id)).all()
        )
        total = len(tasks)
        done_count = sum(1 for task in tasks if task.status == "done")
        todo_count = sum(1 for task in tasks if task.status == "todo")
        in_progress_count = sum(1 for task in tasks if task.status == "in_progress")
        in_review_count = sum(1 for task in tasks if task.status == "in_review")
        overdue_count = sum(
            1
            for task in tasks
            if task.due_date and task.due_date < date.today() and task.status != "done"
        )
        completion_rate = round((done_count / total * 100) if total else 0.0, 2)

        upcoming_deadlines = [
            {
                "id": str(task.id),
                "title": task.title,
                "due_date": str(task.due_date),
                "status": task.status,
                "priority": task.priority,
            }
            for task in sorted(
                (task for task in tasks if task.due_date and task.status != "done"),
                key=lambda task: task.due_date,
            )
            if task.due_date <= date.today() + timedelta(days=14)
        ][:8]

        status_counts = {
            "todo": todo_count,
            "in_progress": in_progress_count,
            "in_review": in_review_count,
            "done": done_count,
        }
        priority_counts: dict[str, int] = {}
        for task in tasks:
            priority_counts[task.priority] = priority_counts.get(task.priority, 0) + 1

        member_count = (
            self.db.scalar(
                select(func.count(ProjectMember.id)).where(
                    ProjectMember.project_id == project_id
                )
            )
            or 0
        )
        active_sprints = (
            self.db.scalar(
                select(func.count(Sprint.id)).where(
                    Sprint.project_id == project_id, Sprint.is_active.is_(True)
                )
            )
            or 0
        )

        assignee_rows = self.db.execute(
            select(
                Task.assignee_id,
                User.first_name,
                User.last_name,
                User.username,
                func.count(Task.id),
                func.count(Task.id).filter(Task.status == "done"),
            )
            .outerjoin(User, User.id == Task.assignee_id)
            .where(Task.project_id == project_id, Task.assignee_id.is_not(None))
            .group_by(Task.assignee_id, User.first_name, User.last_name, User.username)
            .order_by(func.count(Task.id).desc())
            .limit(8)
        ).all()
        team_performance = []
        for (
            assignee_id,
            first_name,
            last_name,
            username,
            assigned,
            completed,
        ) in assignee_rows:
            name = (
                f"{first_name or ''} {last_name or ''}".strip()
                or username
                or "Team member"
            )
            team_performance.append(
                {
                    "user_id": str(assignee_id),
                    "name": name,
                    "assigned": assigned,
                    "completed": completed,
                    "progress": round(completed / assigned * 100, 1) if assigned else 0,
                }
            )

        recent_activity = []
        history_entries = list(
            self.db.scalars(
                select(TaskHistory)
                .join(Task, TaskHistory.task_id == Task.id)
                .where(Task.project_id == project_id)
                .order_by(TaskHistory.created_at.desc())
                .limit(8)
            ).all()
        )
        for entry in history_entries:
            recent_activity.append(
                {
                    "id": str(entry.id),
                    "task_id": str(entry.task_id),
                    "action": entry.action,
                    "summary": (
                        "Created the task"
                        if entry.action == "created"
                        else f"Moved from {entry.previous_status or 'unknown'} to {entry.new_status or 'unknown'}"
                    ),
                    "created_at": entry.created_at,
                }
            )

        return {
            "project_id": str(project.id),
            "project_name": project.name,
            "total_tasks": total,
            "todo_count": todo_count,
            "in_progress_count": in_progress_count,
            "in_review_count": in_review_count,
            "done_count": done_count,
            "overdue_count": overdue_count,
            "completion_rate": completion_rate,
            "member_count": member_count,
            "active_sprints": active_sprints,
            "status": [
                {"name": key, "count": value} for key, value in status_counts.items()
            ],
            "priority": [
                {"name": key, "count": value} for key, value in priority_counts.items()
            ],
            "upcoming_deadlines": upcoming_deadlines,
            "team_performance": team_performance,
            "recent_activity": recent_activity,
        }

    def get_workspace_summary(self, current_user_id: UUID) -> dict:
        """Return dashboard aggregates without materializing every task in Python."""
        from app.models.project_member import ProjectMember
        from app.users.models import User

        project_ids = select(ProjectMember.project_id).where(
            ProjectMember.user_id == current_user_id
        )
        task_scope = Task.project_id.in_(project_ids)

        project_count = (
            self.db.scalar(
                select(func.count())
                .select_from(Project)
                .where(Project.id.in_(project_ids))
            )
            or 0
        )
        user_count = (
            self.db.scalar(
                select(func.count(func.distinct(ProjectMember.user_id))).where(
                    ProjectMember.project_id.in_(project_ids)
                )
            )
            or 0
        )
        total_tasks, completed_tasks, overdue_tasks = self.db.execute(
            select(
                func.count(Task.id),
                func.count(Task.id).filter(Task.status == "done"),
                func.count(Task.id).filter(
                    Task.due_date < date.today(), Task.status != "done"
                ),
            ).where(task_scope)
        ).one()
        active_sprints = (
            self.db.scalar(
                select(func.count(Sprint.id)).where(
                    Sprint.project_id.in_(project_ids), Sprint.is_active.is_(True)
                )
            )
            or 0
        )

        status_rows = self.db.execute(
            select(Task.status, func.count(Task.id))
            .where(task_scope)
            .group_by(Task.status)
        ).all()
        priority_rows = self.db.execute(
            select(Task.priority, func.count(Task.id))
            .where(task_scope)
            .group_by(Task.priority)
        ).all()
        trend_rows = self.db.execute(
            select(
                func.date(Task.created_at).label("day"),
                func.count(Task.id).label("created"),
                func.count(Task.id).filter(Task.status == "done").label("completed"),
            )
            .where(task_scope, Task.created_at >= date.today() - timedelta(days=11))
            .group_by(func.date(Task.created_at))
            .order_by(func.date(Task.created_at))
        ).all()
        performance_rows = self.db.execute(
            select(
                Project.id,
                Project.name,
                func.count(Task.id).label("tasks"),
                func.count(Task.id).filter(Task.status == "done").label("completed"),
                func.count(Task.id)
                .filter(Task.due_date < date.today(), Task.status != "done")
                .label("overdue"),
            )
            .outerjoin(Task, Task.project_id == Project.id)
            .where(Project.id.in_(project_ids))
            .group_by(Project.id, Project.name)
            .order_by(func.count(Task.id).desc())
            .limit(10)
        ).all()
        deadline_rows = self.db.execute(
            select(Task.id, Task.title, Task.due_date, Project.name)
            .join(Project, Project.id == Task.project_id)
            .where(task_scope, Task.due_date.is_not(None), Task.status != "done")
            .order_by(Task.due_date.asc())
            .limit(6)
        ).all()
        activity_rows = self.db.execute(
            select(
                TaskHistory.id,
                TaskHistory.action,
                TaskHistory.previous_status,
                TaskHistory.new_status,
                TaskHistory.created_at,
                Task.title,
            )
            .join(Task, Task.id == TaskHistory.task_id)
            .where(task_scope)
            .order_by(TaskHistory.created_at.desc())
            .limit(6)
        ).all()

        return {
            "period": {
                "start": str(date.today() - timedelta(days=11)),
                "end": str(date.today()),
            },
            "metrics": {
                "users": user_count,
                "projects": project_count,
                "tasks": total_tasks,
                "completed": completed_tasks,
                "overdue": overdue_tasks,
                "active_sprints": active_sprints,
                "completion_rate": round(
                    (completed_tasks / total_tasks * 100) if total_tasks else 0, 1
                ),
            },
            "status": [{"name": name, "count": count} for name, count in status_rows],
            "priority": [
                {"name": name, "count": count} for name, count in priority_rows
            ],
            "trend": [
                {"date": str(day), "created": created, "completed": completed}
                for day, created, completed in trend_rows
            ],
            "projects": [
                {
                    "id": str(project_id),
                    "name": name,
                    "tasks": tasks,
                    "completed": completed,
                    "overdue": overdue,
                    "progress": round((completed / tasks * 100) if tasks else 0, 1),
                }
                for project_id, name, tasks, completed, overdue in performance_rows
            ],
            "upcoming_deadlines": [
                {
                    "id": str(task_id),
                    "title": title,
                    "due_date": str(due_date),
                    "project": project_name,
                }
                for task_id, title, due_date, project_name in deadline_rows
            ],
            "recent_activity": [
                {
                    "id": str(entry_id),
                    "title": task_title,
                    "summary": (
                        "Task created"
                        if action == "created"
                        else f"Moved from {previous_status or 'unknown'} to {new_status or 'unknown'}"
                    ),
                    "created_at": str(created_at),
                }
                for entry_id, action, previous_status, new_status, created_at, task_title in activity_rows
            ],
        }
