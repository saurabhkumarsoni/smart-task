from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dashboards.service import DashboardService
from app.auth.dependencies import get_current_user
from app.users.models import User

router = APIRouter(prefix="/projects/{project_id}/dashboard", tags=["dashboards"])

workspace_router = APIRouter(prefix="/dashboard", tags=["dashboards"])


@workspace_router.get("/workspace")
def workspace_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService(db).get_workspace_summary(current_user.id)


@router.get("")
def project_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    service = DashboardService(db)
    return service.get_project_summary(project_id)
