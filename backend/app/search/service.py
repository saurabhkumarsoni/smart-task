from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task
from app.search.schemas import SearchResponse, SearchResult
from app.users.models import User


class SearchService:
    """Global search constrained to resources the authenticated user can access."""

    def __init__(self, db: Session):
        self.db = db

    def search(self, current_user: User, query: str, limit: int = 8) -> SearchResponse:
        term = query.strip()
        if not term:
            return SearchResponse(query="", results=[], total=0)

        pattern = f"%{term}%"
        results: list[SearchResult] = []

        # People: only users who share at least one project with the requester.
        shared_project_ids = select(ProjectMember.project_id).where(
            ProjectMember.user_id == current_user.id
        )
        people = self.db.scalars(
            select(User)
            .join(ProjectMember, ProjectMember.user_id == User.id)
            .where(
                ProjectMember.project_id.in_(shared_project_ids),
                User.is_active.is_(True),
                User.id != current_user.id,
                or_(
                    User.username.ilike(pattern),
                    User.email.ilike(pattern),
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                ),
            )
            .distinct()
            .order_by(User.username.asc())
            .limit(limit)
        ).all()

        for user in people:
            display_name = (
                f"{user.first_name} {user.last_name}".strip() or user.username
            )
            results.append(
                SearchResult(
                    id=user.id,
                    type="person",
                    title=display_name,
                    subtitle=f"@{user.username}",
                    description=user.email,
                    url=f"/settings?user={user.id}",
                    avatar_url=f"https://api.dicebear.com/8.x/thumbs/svg?seed={user.username}",
                    meta="People",
                )
            )

        # Projects: only projects where the requester is a member.
        projects = self.db.scalars(
            select(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(
                ProjectMember.user_id == current_user.id,
                Project.is_active.is_(True),
                or_(
                    Project.name.ilike(pattern),
                    Project.key.ilike(pattern),
                    Project.description.ilike(pattern),
                ),
            )
            .distinct()
            .order_by(Project.name.asc())
            .limit(limit)
        ).all()

        for project in projects:
            results.append(
                SearchResult(
                    id=project.id,
                    type="project",
                    title=project.name,
                    subtitle=project.key,
                    description=project.description,
                    url=f"/projects/{project.id}",
                    meta="Projects",
                )
            )

        # Tasks: only tasks belonging to projects the requester can access.
        tasks = self.db.scalars(
            select(Task)
            .join(ProjectMember, ProjectMember.project_id == Task.project_id)
            .where(
                ProjectMember.user_id == current_user.id,
                or_(
                    Task.title.ilike(pattern),
                    Task.description.ilike(pattern),
                    Task.status.ilike(pattern),
                    Task.priority.ilike(pattern),
                ),
            )
            .distinct()
            .order_by(Task.updated_at.desc())
            .limit(limit)
        ).all()

        project_names = (
            {
                project.id: project.name
                for project in self.db.scalars(
                    select(Project).where(
                        Project.id.in_([task.project_id for task in tasks])
                    )
                ).all()
            }
            if tasks
            else {}
        )

        for task in tasks:
            results.append(
                SearchResult(
                    id=task.id,
                    type="task",
                    title=task.title,
                    subtitle=project_names.get(task.project_id),
                    description=task.description,
                    url=f"/projects/{task.project_id}/tasks/{task.id}",
                    meta=f"{task.status.replace('_', ' ').title()} · {task.priority.title()}",
                )
            )

        # Keep the response compact and predictable for the command palette.
        ordered = sorted(
            results,
            key=lambda item: (
                {"person": 0, "project": 1, "task": 2}[item.type],
                item.title.lower(),
            ),
        )
        ordered = ordered[: limit * 3]
        return SearchResponse(query=term, results=ordered, total=len(ordered))
