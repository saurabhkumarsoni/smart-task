from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.schemas.sprint import SprintCreate, SprintResponse, SprintUpdate
from app.sprints.service import SprintService
from app.users.models import User

router = APIRouter(prefix="/projects/{project_id}/sprints", tags=["sprints"])


@router.post("", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(
    project_id: UUID,
    data: SprintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SprintService(db)
    return service.create_sprint(project_id, data, current_user)


@router.get("", response_model=list[SprintResponse])
def list_sprints(project_id: UUID, db: Session = Depends(get_db)):
    service = SprintService(db)
    return service.get_project_sprints(project_id)


@router.put("/{sprint_id}", response_model=SprintResponse)
def update_sprint(sprint_id: UUID, data: SprintUpdate, db: Session = Depends(get_db)):
    service = SprintService(db)
    return service.update_sprint(sprint_id, data)


@router.post("/{sprint_id}/tasks/{task_id}", status_code=status.HTTP_200_OK)
def assign_task(sprint_id: UUID, task_id: UUID, db: Session = Depends(get_db)):
    service = SprintService(db)
    service.assign_task_to_sprint(sprint_id, task_id)
    return {"status": "assigned"}
