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
    """
    Service layer for task operations.

    Task status values stored in the database are always:

        todo
        in_progress
        in_review
        done

    The frontend can send values such as:

        TODO
        IN_PROGRESS
        IN PROGRESS
        IN_REVIEW
        IN REVIEW
        DONE

    Those values are normalized before validation/persistence.
    """

    WORKFLOW_SEQUENCE = [
        "todo",
        "in_progress",
        "in_review",
        "done",
    ]

    def __init__(self, db: Session):
        self.db = db

    # =========================================================
    # STATUS HELPERS
    # =========================================================

    def _normalize_status(self, status_value: str | None) -> str:
        """
        Convert any supported frontend/backend status format
        into the canonical database format.
        """

        if status_value is None:
            return "todo"

        normalized = str(status_value).strip().upper()

        status_map = {
            "TODO": "todo",
            "TO DO": "todo",
            "IN_PROGRESS": "in_progress",
            "IN PROGRESS": "in_progress",
            "IN-PROGRESS": "in_progress",
            "IN_REVIEW": "in_review",
            "IN REVIEW": "in_review",
            "IN-REVIEW": "in_review",
            "REVIEW": "in_review",
            "DONE": "done",
            "COMPLETED": "done",
        }

        if normalized not in status_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid task status: {status_value}",
            )

        return status_map[normalized]

    def _display_status(self, status_value: str | None) -> str:
        """
        Convert database status into a human-readable status.
        """

        if not status_value:
            return "To Do"

        status_map = {
            "todo": "To Do",
            "in_progress": "In Progress",
            "in_review": "In Review",
            "done": "Done",
        }

        return status_map.get(
            status_value,
            str(status_value).replace("_", " ").title(),
        )

    def _validate_status_transition(
        self,
        current_status: str,
        new_status: str,
    ) -> None:
        """
        Validate task workflow movement.

        Current workflow:

            TODO -> IN_PROGRESS -> IN_REVIEW -> DONE

        At the moment only moving one step forward is allowed.
        """

        current_status = self._normalize_status(current_status)
        new_status = self._normalize_status(new_status)

        if current_status == new_status:
            return

        try:
            current_index = self.WORKFLOW_SEQUENCE.index(current_status)
            new_index = self.WORKFLOW_SEQUENCE.index(new_status)

        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid task status transition: "
                    f"{current_status} -> {new_status}"
                ),
            ) from exc

        if new_index != current_index + 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid task status transition: "
                    f"{self._display_status(current_status)} -> "
                    f"{self._display_status(new_status)}"
                ),
            )

    # =========================================================
    # PROJECT ACCESS
    # =========================================================

    def _get_project_or_404(
        self,
        project_id: UUID,
    ) -> Project:

        project = self.db.scalar(select(Project).where(Project.id == project_id))

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
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

        # Project owner can access even if a ProjectMember record
        # is not present.
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

        return project

    # =========================================================
    # CREATE TASK
    # =========================================================

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
            allowed_roles
            or (
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
            ),
        )

        if isinstance(data, dict):
            payload = dict(data)
        else:
            payload = data.model_dump()

        task_status = self._normalize_status(payload.get("status", "todo"))

        task = Task(
            project_id=project_id,
            title=payload["title"],
            description=payload.get("description"),
            status=task_status,
            priority=payload.get("priority", "medium"),
            assignee_id=payload.get("assignee_id"),
            created_by=current_user.id,
            due_date=payload.get("due_date"),
            sprint_id=payload.get("sprint_id"),
        )

        self.db.add(task)

        self.db.commit()

        self.db.refresh(task)

        # -----------------------------------------------------
        # Due date reminder
        # -----------------------------------------------------

        if task.due_date:

            job_service = JobService()

            def reminder_job(
                task_id: str,
                creator_id: str,
                title: str,
                due_date,
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
                    message=(
                        f"Task '{title}' is due on " f"{due_date_value.isoformat()}"
                    ),
                )

            job_service.register(
                "task_due_reminder",
                reminder_job,
            )

            job_service.enqueue(
                "task_due_reminder",
                str(task.id),
                str(current_user.id),
                task.title,
                task.due_date,
            )

            job_service.run_pending()

        return task

    # =========================================================
    # GET PROJECT TASKS
    # =========================================================

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
            normalized_status = self._normalize_status(filter_params.status)

            query = query.where(Task.status == normalized_status)

        if filter_params.priority:
            query = query.where(Task.priority == filter_params.priority)

        if filter_params.assignee_id:
            query = query.where(Task.assignee_id == UUID(filter_params.assignee_id))

        if filter_params.sprint_id:
            query = query.where(Task.sprint_id == UUID(filter_params.sprint_id))

        if filter_params.search:
            search_value = f"%{filter_params.search.lower()}%"

            query = query.where(Task.title.ilike(search_value))

        if filter_params.due_before:
            query = query.where(Task.due_date <= filter_params.due_before)

        if filter_params.due_after:
            query = query.where(Task.due_date >= filter_params.due_after)

        allowed_sort_fields = {
            "created_at",
            "title",
            "status",
            "priority",
            "due_date",
        }

        if filter_params.sort_by not in allowed_sort_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Unsupported sort field: " f"{filter_params.sort_by}"),
            )

        if filter_params.sort_order.lower() not in {
            "asc",
            "desc",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Unsupported sort order: " f"{filter_params.sort_order}"),
            )

        sort_column = getattr(
            Task,
            filter_params.sort_by,
            Task.created_at,
        )

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

    # =========================================================
    # TASK OVERVIEW
    # =========================================================

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
            normalized_status = self._normalize_status(filter_params.status)

            query = query.where(Task.status == normalized_status)

        if filter_params.priority:
            query = query.where(Task.priority == filter_params.priority)

        if filter_params.assignee_id:
            query = query.where(Task.assignee_id == UUID(filter_params.assignee_id))

        if filter_params.sprint_id:
            query = query.where(Task.sprint_id == UUID(filter_params.sprint_id))

        if filter_params.search:
            search_value = f"%{filter_params.search.lower()}%"

            query = query.where(Task.title.ilike(search_value))

        if filter_params.due_before:
            query = query.where(Task.due_date <= filter_params.due_before)

        if filter_params.due_after:
            query = query.where(Task.due_date >= filter_params.due_after)

        allowed_sort_fields = {
            "created_at",
            "title",
            "status",
            "priority",
            "due_date",
        }

        if filter_params.sort_by not in allowed_sort_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Unsupported sort field: " f"{filter_params.sort_by}"),
            )

        if filter_params.sort_order.lower() not in {
            "asc",
            "desc",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Unsupported sort order: " f"{filter_params.sort_order}"),
            )

        sort_column = getattr(
            Task,
            filter_params.sort_by,
            Task.created_at,
        )

        if filter_params.sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        tasks = list(self.db.scalars(query).all())

        offset = (filter_params.page - 1) * filter_params.size

        paged_tasks = tasks[offset : offset + filter_params.size]

        summary = "Showing all tasks"

        if filter_params.status:
            summary = (
                f"Showing " f"{self._display_status(filter_params.status)} " f"tasks"
            )

        elif filter_params.search:
            summary = f"Showing tasks matching " f"'{filter_params.search}'"

        return TaskOverview(
            total_count=len(tasks),
            page=filter_params.page,
            size=filter_params.size,
            summary=summary,
            tasks=[task.__dict__ for task in paged_tasks],
        )

    # =========================================================
    # GET TASK
    # =========================================================

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
            select(Task).where(
                Task.id == task_id,
                Task.project_id == project_id,
            )
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return task

    # =========================================================
    # TASK DETAIL
    # =========================================================

    def get_task_detail(
        self,
        project_id: UUID,
        task_id: UUID,
        current_user: User | None = None,
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

    # =========================================================
    # UPDATE TASK
    # =========================================================

    def update_task(
        self,
        project_id: UUID,
        task_id: UUID,
        data: TaskUpdate | dict,
        current_user: User | None = None,
        allowed_roles: tuple[ProjectRole, ...] | None = None,
    ):
        """
        Update a task.

        This method supports both:

            TaskUpdate(...)

        and:

            {"status": "IN_PROGRESS"}

        Status is normalized before validation and persistence.

        Example frontend request:

            {
                "status": "IN_PROGRESS"
            }

        Database value becomes:

            in_progress
        """

        # -----------------------------------------------------
        # 1. Get task and verify project/member access
        # -----------------------------------------------------

        task = self.get_task(
            project_id,
            task_id,
            current_user=current_user,
            allowed_roles=allowed_roles
            or (
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
                ProjectRole.MEMBER,
            ),
        )

        # -----------------------------------------------------
        # 2. Convert request to dictionary
        # -----------------------------------------------------

        if isinstance(data, dict):
            payload = dict(data)
        else:
            payload = data.model_dump(exclude_unset=True)

        # -----------------------------------------------------
        # 3. Normalize status
        # -----------------------------------------------------

        if "status" in payload and payload["status"] is not None:
            payload["status"] = self._normalize_status(payload["status"])

        # -----------------------------------------------------
        # 4. Store previous status
        # -----------------------------------------------------

        previous_status = self._normalize_status(task.status)

        # If an old database value happens to be uppercase,
        # normalize the task object as well.
        if task.status != previous_status:
            task.status = previous_status

        # -----------------------------------------------------
        # 5. Validate workflow transition
        # -----------------------------------------------------

        if "status" in payload and payload["status"] is not None:

            new_status = payload["status"]

            self._validate_status_transition(
                previous_status,
                new_status,
            )

        # -----------------------------------------------------
        # 6. Apply all task changes
        # -----------------------------------------------------

        for field, value in payload.items():

            if value is not None:
                setattr(
                    task,
                    field,
                    value,
                )

        # -----------------------------------------------------
        # 7. Save database
        # -----------------------------------------------------

        self.db.commit()

        self.db.refresh(task)

        # -----------------------------------------------------
        # 8. Check whether status actually changed
        # -----------------------------------------------------

        status_changed = (
            "status" in payload
            and payload["status"] is not None
            and previous_status != task.status
        )

        # -----------------------------------------------------
        # 9. Create history + notification
        # -----------------------------------------------------

        if status_changed:

            history_service = TaskHistoryService(self.db)

            history_service.create_history_entry(
                task_id=task.id,
                previous_status=previous_status,
                new_status=task.status,
                changed_by=current_user,
                action="updated",
            )

            # -------------------------------------------------
            # Notification job
            # -------------------------------------------------

            job_service = JobService()

            def status_change_job(
                task_id: str,
                creator_id: str,
                new_status: str,
                old_status: str,
                task_title: str,
            ) -> None:

                notification_service = NotificationService(self.db)

                notification_service.create_notification(
                    user_id=creator_id,
                    task_id=task_id,
                    title="Task status updated",
                    message=(
                        f"Task '{task_title}' status changed "
                        f"from "
                        f"{self._display_status(old_status)} "
                        f"to "
                        f"{self._display_status(new_status)}"
                    ),
                )

            job_service.register(
                "task_status_change",
                status_change_job,
            )

            job_service.enqueue(
                "task_status_change",
                str(task.id),
                str(task.created_by),
                task.status,
                previous_status,
                task.title,
            )

            job_service.run_pending()

            self.db.refresh(task)

        return task

    # =========================================================
    # DELETE TASK
    # =========================================================

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
            allowed_roles=allowed_roles
            or (
                ProjectRole.OWNER,
                ProjectRole.ADMIN,
            ),
        )

        self.db.delete(task)

        self.db.commit()

    # =========================================================
    # ATTACHMENTS
    # =========================================================

    def add_task_attachment(
        self,
        task_id: UUID,
        data: TaskAttachmentCreate | dict,
        current_user: User | None = None,
    ):

        task = self.db.scalar(select(Task).where(Task.id == task_id))

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        payload = data if isinstance(data, dict) else data.model_dump()

        attachment = TaskAttachment(
            task_id=task_id,
            file_name=payload["file_name"],
            content_type=payload.get("content_type"),
            size_bytes=payload.get("size_bytes"),
            uploaded_by=(current_user.id if current_user else None),
            notes=payload.get("notes"),
        )

        self.db.add(attachment)

        self.db.commit()

        self.db.refresh(attachment)

        return attachment

    def list_task_attachments(
        self,
        task_id: UUID,
    ):

        task = self.db.scalar(select(Task).where(Task.id == task_id))

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        query = (
            select(TaskAttachment)
            .where(TaskAttachment.task_id == task_id)
            .order_by(TaskAttachment.created_at.desc())
        )

        return list(self.db.scalars(query).all())
