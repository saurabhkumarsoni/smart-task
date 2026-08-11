from uuid import UUID

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.project_member import ProjectMember
from app.models.project_member import ProjectRole
from app.users.models import User


def require_project_role(allowed_roles: list[ProjectRole]):

    def dependency(
        project_id: UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):

        member = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == current_user.id,
            )
        )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )

        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission for this action",
            )

        return member

    return dependency
