from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.sprint import Sprint
from app.models.task import Task
from app.schemas.sprint import SprintCreate, SprintUpdate
from app.users.models import User


class SprintService:
    def __init__(self, db: Session):
        self.db = db

    def create_sprint(
        self, project_id: UUID, data: SprintCreate | dict, current_user: User
    ):
        payload = data if isinstance(data, dict) else data.model_dump()
        project = self.db.scalar(select(Project).where(Project.id == project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        def normalize_date(value):
            if value is None or isinstance(value, date):
                return value
            if isinstance(value, str):
                return date.fromisoformat(value)
            return value

        sprint = Sprint(
            project_id=project_id,
            name=payload["name"],
            goal=payload.get("goal"),
            start_date=normalize_date(payload.get("start_date")),
            end_date=normalize_date(payload.get("end_date")),
        )
        self.db.add(sprint)
        self.db.commit()
        self.db.refresh(sprint)
        return sprint

    def get_project_sprints(self, project_id: UUID):
        query = (
            select(Sprint)
            .where(Sprint.project_id == project_id)
            .order_by(Sprint.start_date.desc().nullslast(), Sprint.created_at.desc())
        )
        return list(self.db.scalars(query).all())

    def get_sprint(self, sprint_id: UUID):
        sprint = self.db.scalar(select(Sprint).where(Sprint.id == sprint_id))
        if not sprint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found"
            )
        return sprint

    def update_sprint(self, sprint_id: UUID, data: SprintUpdate | dict):
        payload = (
            data if isinstance(data, dict) else data.model_dump(exclude_unset=True)
        )
        sprint = self.get_sprint(sprint_id)
        for field, value in payload.items():
            if value is not None:
                setattr(sprint, field, value)
        self.db.commit()
        self.db.refresh(sprint)
        return sprint

    def assign_task_to_sprint(self, sprint_id: UUID, task_id: UUID):
        sprint = self.get_sprint(sprint_id)
        task = self.db.scalar(select(Task).where(Task.id == task_id))
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )
        task.sprint_id = sprint_id
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_sprint_tasks(self, sprint_id: UUID):
        self.get_sprint(sprint_id)
        query = select(Task).where(Task.sprint_id == sprint_id)
        return list(self.db.scalars(query).all())
