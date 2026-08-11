from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task

from app.schemas.task_filter import TaskFilterParams, TaskOverview

from app.jobs.service import JobService
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.models.task_attachment import TaskAttachment
from app.models.comment import Comment
from app.notifications.service import NotificationService
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.task_attachment import TaskAttachmentCreate
from app.task_history.service import TaskHistoryService
from app.users.models import User


class TaskService:
    WORKFLOW_SEQUENCE = ["todo", "in_progress", "in_review", "done"]

    def __init__(self, db: Session):
        self.db = db

    def _validate_status_transition(self, current_status: str, new_status: str) -> None:
        if current_status == new_status:
            return

        try:
            current_index = self.WORKFLOW_SEQUENCE.index(current_status)
            new_index = self.WORKFLOW_SEQUENCE.index(new_status)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid task status transition: {current_status} -> {new_status}",
            ) from exc

        if new_index != current_index + 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid task status transition: {current_status} -> {new_status}",
            )

    def _get_project_or_404(self, project_id: UUID) -> Project:
        project = self.db.scalar(select(Project).where(Project.id == project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        return project

    def _ensure_project_access(
        self,
        project_id: UUID,
        current_user: User | None,
        allowed_roles: tuple[ProjectRole, ...],
    ) -> Project:
        project = self._get_project_or_404(project_id)

        if current_user is None:
            return project

        membership = self.db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == current_user.id,
            )
        )

        if not membership and project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )

        if membership and membership.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission for this action",
            )

        if not membership and project.owner_id == current_user.id:
            return project

        return project

    def create_task(
        self,
        project_id: UUID,
        data: TaskCreate | dict,
        current_user: User,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
    ) -> Task:
        self._ensure_project_access(
            project_id,
            current_user,
            allowed_roles or (ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER),
        )

        if isinstance(data, dict):
            payload = data
        else:
            payload = data.model_dump()

        task = Task(
            project_id=project_id,
            title=payload["title"],
            description=payload.get("description"),
            status=payload.get("status", "todo"),
            priority=payload.get("priority", "medium"),
            assignee_id=payload.get("assignee_id"),
            created_by=current_user.id,
            due_date=payload.get("due_date"),
        )

        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)

        if task.due_date:
            job_service = JobService()

            def reminder_job(
                task_id: str, creator_id: str, title: str, due_date
            ) -> None:
                notification_service = NotificationService(self.db)
                if hasattr(due_date, "date"):
                    due_date_value = due_date.date()
                else:
                    due_date_value = due_date
                notification_service.create_notification(
                    user_id=creator_id,
                    task_id=task_id,
                    title="Task reminder",
                    message=f"Task '{title}' is due on {due_date_value.isoformat()}",
                )

            job_service.register("task_due_reminder", reminder_job)
            job_service.enqueue(
                "task_due_reminder",
                task.id,
                current_user.id,
                task.title,
                task.due_date,
            )
            job_service.run_pending()

        return task

    def get_project_tasks(
        self,
        project_id: UUID,
        current_user: User | None = None,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
        filters: TaskFilterParams | None = None,
    ):
        self._ensure_project_access(
            project_id,
            current_user,
            allowed_roles
            or (
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ),
        )
        filter_params = filters or TaskFilterParams()
        query = select(Task).where(Task.project_id == project_id)

        if filter_params.status:
            query = query.where(Task.status == filter_params.status)
        if filter_params.priority:
            query = query.where(Task.priority == filter_params.priority)
        if filter_params.assignee_id:
            query = query.where(Task.assignee_id == UUID(filter_params.assignee_id))
        if filter_params.search:
            search_value = f"%{filter_params.search.lower()}%"
            query = query.where(Task.title.ilike(search_value))
        if filter_params.due_before:
            query = query.where(Task.due_date <= filter_params.due_before)
        if filter_params.due_after:
            query = query.where(Task.due_date >= filter_params.due_after)

        allowed_sort_fields = {"created_at", "title", "status", "priority", "due_date"}
        if filter_params.sort_by not in allowed_sort_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported sort field: {filter_params.sort_by}",
            )

        if filter_params.sort_order.lower() not in {"asc", "desc"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported sort order: {filter_params.sort_order}",
            )

        sort_column = getattr(Task, filter_params.sort_by, Task.created_at)
        if filter_params.sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        matched_tasks = list(self.db.scalars(query).all())
        total_count = len(matched_tasks)
        page = filter_params.page
        size = filter_params.size
        offset = (page - 1) * size
        paged_tasks = matched_tasks[offset : offset + size]

        return paged_tasks

    def get_task_overview(
        self,
        project_id: UUID,
        current_user: User | None = None,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
        filters: TaskFilterParams | None = None,
    ) -> TaskOverview:
        self._ensure_project_access(
            project_id,
            current_user,
            allowed_roles
            or (
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ),
        )
        filter_params = filters or TaskFilterParams()
        query = select(Task).where(Task.project_id == project_id)

        if filter_params.status:
            query = query.where(Task.status == filter_params.status)
        if filter_params.priority:
            query = query.where(Task.priority == filter_params.priority)
        if filter_params.assignee_id:
            query = query.where(Task.assignee_id == UUID(filter_params.assignee_id))
        if filter_params.search:
            search_value = f"%{filter_params.search.lower()}%"
            query = query.where(Task.title.ilike(search_value))
        if filter_params.due_before:
            query = query.where(Task.due_date <= filter_params.due_before)
        if filter_params.due_after:
            query = query.where(Task.due_date >= filter_params.due_after)

        allowed_sort_fields = {"created_at", "title", "status", "priority", "due_date"}
        if filter_params.sort_by not in allowed_sort_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported sort field: {filter_params.sort_by}",
            )

        if filter_params.sort_order.lower() not in {"asc", "desc"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported sort order: {filter_params.sort_order}",
            )

        sort_column = getattr(Task, filter_params.sort_by, Task.created_at)
        if filter_params.sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        tasks = list(self.db.scalars(query).all())
        offset = (filter_params.page - 1) * filter_params.size
        paged_tasks = tasks[offset : offset + filter_params.size]

        summary = "Showing all tasks"
        if filter_params.status:
            summary = f"Showing {filter_params.status} tasks"
        elif filter_params.search:
            summary = f"Showing tasks matching '{filter_params.search}'"

        return TaskOverview(
            total_count=len(tasks),
            page=filter_params.page,
            size=filter_params.size,
            summary=summary,
            tasks=[task.__dict__ for task in paged_tasks],
        )

    def add_task_attachment(
        self,
        task_id: UUID,
        data: TaskAttachmentCreate | dict,
        current_user: User | None = None,
    ):
        task = self.db.scalar(select(Task).where(Task.id == task_id))
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )

        payload = data if isinstance(data, dict) else data.model_dump()
        attachment = TaskAttachment(
            task_id=task_id,
            file_name=payload["file_name"],
            content_type=payload.get("content_type"),
            size_bytes=payload.get("size_bytes"),
            uploaded_by=current_user.id if current_user else None,
            notes=payload.get("notes"),
        )
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        return attachment

    def list_task_attachments(self, task_id: UUID):
        task = self.db.scalar(select(Task).where(Task.id == task_id))
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )
        query = (
            select(TaskAttachment)
            .where(TaskAttachment.task_id == task_id)
            .order_by(TaskAttachment.created_at.desc())
        )
        return list(self.db.scalars(query).all())

    def get_task(
        self,
        project_id: UUID,
        task_id: UUID,
        current_user: User | None = None,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
    ):
        self._ensure_project_access(
            project_id,
            current_user,
            allowed_roles
            or (
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ),
        )
        task = self.db.scalar(
            select(Task).where(Task.id == task_id, Task.project_id == project_id)
        )
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )
        return task

    def get_task_detail(
        self, project_id: UUID, task_id: UUID, current_user: User | None = None
    ):
        task = self.get_task(
            project_id,
            task_id,
            current_user=current_user,
            allowed_roles=(
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
                ProjectRole.VIEWER,
            ),
        )

        comments = list(
            self.db.scalars(
                select(Comment)
                .where(Comment.task_id == task.id)
                .order_by(Comment.created_at.asc())
            ).all()
        )
        attachments = list(
            self.db.scalars(
                select(TaskAttachment)
                .where(TaskAttachment.task_id == task.id)
                .order_by(TaskAttachment.created_at.desc())
            ).all()
        )

        return {
            "task": task,
            "comments": comments,
            "attachments": attachments,
        }

    def update_task(
        self,
        project_id: UUID,
        task_id: UUID,
        data: TaskUpdate | dict,
        current_user: User | None = None,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
    ):
        task = self.get_task(
            project_id,
            task_id,
            current_user=current_user,
            allowed_roles=allowed_roles
            or (ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER),
        )

        if isinstance(data, dict):
            payload = data
        else:
            payload = data.model_dump(exclude_unset=True)

        if "status" in payload and payload["status"] is not None:
            self._validate_status_transition(task.status, payload["status"])

        previous_status = task.status
        for field, value in payload.items():
            if value is not None:
                setattr(task, field, value)

        self.db.commit()
        self.db.refresh(task)

        if "status" in payload and payload["status"] is not None:
            history_service = TaskHistoryService(self.db)
            history_service.create_history_entry(
                task_id=task.id,
                previous_status=previous_status,
                new_status=task.status,
                changed_by=current_user,
                action="updated",
            )

            job_service = JobService()

            def status_change_job(
                task_id: str, creator_id: str, new_status: str
            ) -> None:
                notification_service = NotificationService(self.db)
                notification_service.create_notification(
                    user_id=creator_id,
                    task_id=task_id,
                    title="Task updated",
                    message=f"Task status changed to {new_status}",
                )

            job_service.register("task_status_change", status_change_job)
            job_service.enqueue(
                "task_status_change", task.id, task.created_by, task.status
            )
            job_service.run_pending()

        self.db.refresh(task)

        return task

    def delete_task(
        self,
        project_id: UUID,
        task_id: UUID,
        current_user: User | None = None,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
    ):
        task = self.get_task(
            project_id,
            task_id,
            current_user=current_user,
            allowed_roles=allowed_roles or (ProjectRole.OWNER, ProjectRole.ADMIN),
        )
        self.db.delete(task)
        self.db.commit()
