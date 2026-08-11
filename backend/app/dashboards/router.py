from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dashboards.service import DashboardService

router = APIRouter(prefix="/projects/{project_id}/dashboard", tags=["dashboards"])


@router.get("")
def project_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    service = DashboardService(db)
    return service.get_project_summary(project_id)
