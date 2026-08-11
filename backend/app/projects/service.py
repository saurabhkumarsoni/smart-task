from uuid import UUID

from fastapi import HTTPException
from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.project_member import ProjectRole
from app.models.task import Task
from app.schemas.project import ProjectCreate
from app.users.models import User
from app.schemas.project import ProjectOverview
from app.schemas.project import ProjectUpdate
from app.schemas.project import WorkspaceOverview
from app.schemas.project_member import ProjectMemberCreate
from app.schemas.project_member import ProjectMemberRoleUpdate
from app.schemas.project_member import ProjectMemberResponse


class ProjectService:

    def __init__(self, db: Session):
        self.db = db

    def create_project(
        self,
        data: ProjectCreate,
        current_user: User,
    ):

        existing_project = self.db.scalar(
            select(Project).where(Project.key == data.key.upper())
        )

        if existing_project:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project key already exists",
            )

        project = Project(
            name=data.name,
            key=data.key.upper(),
            description=data.description,
            owner_id=current_user.id,
        )

        self.db.add(project)
        self.db.flush()

        owner_member = ProjectMember(
            project_id=project.id,
            user_id=current_user.id,
            role=ProjectRole.OWNER,
        )

        self.db.add(owner_member)
        self.db.commit()
        self.db.refresh(project)

        return project

    def get_project(
        self,
        project_id: UUID,
    ):

        project = self.db.scalar(select(Project).where(Project.id == project_id))

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        return project

    def get_project_overview(self, project_id: UUID) -> ProjectOverview:
        project = self.get_project(project_id)

        tasks = list(
            self.db.scalars(select(Task).where(Task.project_id == project_id)).all()
        )
        members = list(
            self.db.scalars(
                select(ProjectMember).where(ProjectMember.project_id == project_id)
            ).all()
        )
        member_count = len(members)

        completed_tasks = sum(1 for task in tasks if task.status == "done")
        active_tasks = sum(
            1 for task in tasks if task.status in {"todo", "in_progress"}
        )
        summary = f"{completed_tasks} completed and {active_tasks} active tasks across {member_count} members"

        return ProjectOverview(
            project_id=project.id,
            project_name=project.name,
            total_tasks=len(tasks),
            completed_tasks=completed_tasks,
            active_tasks=active_tasks,
            member_count=member_count,
            summary=summary,
        )

    def get_user_projects(
        self,
        current_user: User,
    ):

        query = (
            select(Project)
            .join(
                ProjectMember,
                ProjectMember.project_id == Project.id,
            )
            .where(
                ProjectMember.user_id == current_user.id,
                Project.is_active.is_(True),
            )
            .order_by(Project.created_at.desc())
        )

        return list(self.db.scalars(query).all())

    def get_workspace_overview(self, current_user: User) -> WorkspaceOverview:
        projects = self.get_user_projects(current_user)
        all_tasks = []

        for project in projects:
            all_tasks.extend(
                list(
                    self.db.scalars(
                        select(Task).where(Task.project_id == project.id)
                    ).all()
                )
            )

        completed_tasks = sum(1 for task in all_tasks if task.status == "done")
        active_tasks = sum(
            1 for task in all_tasks if task.status in {"todo", "in_progress"}
        )
        summary = f"You have {len(projects)} projects with {completed_tasks} completed and {active_tasks} active tasks"

        return WorkspaceOverview(
            project_count=len(projects),
            total_tasks=len(all_tasks),
            completed_tasks=completed_tasks,
            active_tasks=active_tasks,
            summary=summary,
        )

    def update_project(
        self,
        project_id: UUID,
        data: ProjectUpdate,
    ):

        project = self.get_project(project_id)

        if data.name is not None:
            project.name = data.name

        if data.description is not None:
            project.description = data.description

        if data.is_active is not None:
            project.is_active = data.is_active

        self.db.commit()
        self.db.refresh(project)

        return project

    def delete_project(
        self,
        project_id: UUID,
    ):

        project = self.get_project(project_id)

        self.db.delete(project)
        self.db.commit()

    def add_member(
        self,
        project_id: UUID,
        data: ProjectMemberCreate,
    ):

        self.get_project(project_id)

        user = self.db.scalar(select(User).where(User.id == data.user_id))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        existing_member = self.db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == data.user_id,
            )
        )

        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a project member",
            )

        member = ProjectMember(
            project_id=project_id,
            user_id=data.user_id,
            role=data.role,
        )

        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)

        return member

    def get_members(
        self,
        project_id: UUID,
    ):

        self.get_project(project_id)

        query = select(ProjectMember).where(ProjectMember.project_id == project_id)
        members = list(self.db.scalars(query).all())

        responses = []
        for member in members:
            user = self.db.scalar(select(User).where(User.id == member.user_id))
            responses.append(
                ProjectMemberResponse(
                    id=member.id,
                    project_id=member.project_id,
                    user_id=member.user_id,
                    role=member.role,
                    joined_at=member.joined_at,
                    user_name=(
                        f"{user.first_name} {user.last_name}".strip()
                        if user and (user.first_name or user.last_name)
                        else user.username if user else None
                    ),
                    user_email=user.email if user else None,
                )
            )

        return responses

    def update_member_role(
        self,
        project_id: UUID,
        user_id: UUID,
        data: ProjectMemberRoleUpdate,
    ):

        member = self.db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project member not found",
            )

        if member.role == ProjectRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project owner role cannot be changed",
            )

        member.role = data.role

        self.db.commit()
        self.db.refresh(member)

        return member

    def remove_member(
        self,
        project_id: UUID,
        user_id: UUID,
    ):

        member = self.db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project member not found",
            )

        if member.role == ProjectRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project owner cannot be removed",
            )

        self.db.delete(member)
        self.db.commit()
