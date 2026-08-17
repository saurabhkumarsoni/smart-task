from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import BASE_DIR
from app.database import get_db
from app.models.project_member import ProjectRole
from app.models.task_attachment import TaskAttachment
from app.projects.dependencies import require_project_role
from app.schemas.task_attachment import TaskAttachmentResponse
from app.tasks.service import TaskService
from app.users.models import User

router = APIRouter(prefix="/projects/{project_id}/tasks/{task_id}/attachments", tags=["task-attachments"])
STORAGE_ROOT = BASE_DIR / "storage" / "attachments"
MAX_FILE_SIZE = 10 * 1024 * 1024


def _safe_name(name: str) -> str:
    cleaned = Path(name or "attachment").name.strip().replace("..", "_")
    return cleaned[:255] or "attachment"


def _stored_path(task_id: UUID, attachment_id: UUID) -> Path:
    return STORAGE_ROOT / str(task_id) / f"{attachment_id}.bin"


def _get_task(db: Session, project_id: UUID, task_id: UUID, user: User):
    return TaskService(db).get_task(project_id, task_id, user, (ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER))


@router.post("", response_model=TaskAttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    project_id: UUID,
    task_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER])),
):
    task = _get_task(db, project_id, task_id, current_user)
    data = file.file.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Attachments must be 10 MB or smaller")
    service = TaskService(db)
    attachment = service.add_task_attachment(task.id, {
        "file_name": _safe_name(file.filename or "attachment"),
        "content_type": file.content_type,
        "size_bytes": len(data),
    }, current_user)
    path = _stored_path(task_id, attachment.id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return attachment


@router.get("", response_model=list[TaskAttachmentResponse])
def list_attachments(
    project_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER])),
):
    _get_task(db, project_id, task_id, current_user)
    return TaskService(db).list_task_attachments(task_id)


@router.get("/{attachment_id}/download")
def download_attachment(
    project_id: UUID,
    task_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER])),
):
    _get_task(db, project_id, task_id, current_user)
    attachment = db.get(TaskAttachment, attachment_id)
    if not attachment or attachment.task_id != task_id:
        raise HTTPException(status_code=404, detail="Attachment not found")
    path = _stored_path(task_id, attachment.id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Attachment file not found")
    return FileResponse(path, media_type=attachment.content_type or "application/octet-stream", filename=attachment.file_name)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    project_id: UUID,
    task_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_role([ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER])),
):
    _get_task(db, project_id, task_id, current_user)
    attachment = db.get(TaskAttachment, attachment_id)
    if not attachment or attachment.task_id != task_id:
        raise HTTPException(status_code=404, detail="Attachment not found")
    path = _stored_path(task_id, attachment.id)
    if path.exists():
        path.unlink()
    db.delete(attachment)
    db.commit()
    return None
