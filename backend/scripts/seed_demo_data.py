"""Load the API-ready demo workspace from ``backend/fixtures/demo-data.json``.

Run from the repository root:
    .venv\\Scripts\\python.exe backend/scripts/seed_demo_data.py

The seed is idempotent: records with the fixture UUIDs are left unchanged.
"""

import json
import sys
from datetime import date
from pathlib import Path
from uuid import UUID

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPOSITORY_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.auth.security import hash_password  # noqa: E402
from app.database import SessionLocal, init_db  # noqa: E402
from app.models.comment import Comment  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.organization_member import OrganizationMember, OrganizationRole  # noqa: E402
from app.models.project import Project  # noqa: E402
from app.models.project_member import ProjectMember, ProjectRole  # noqa: E402
from app.models.sprint import Sprint  # noqa: E402
from app.models.task import Task  # noqa: E402
from app.models.task_attachment import TaskAttachment  # noqa: E402
from app.models.task_history import TaskHistory  # noqa: E402
from app.users.models import User, UserRole  # noqa: E402


def uid(value: str | None) -> UUID | None:
    return UUID(value) if value else None


def as_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def insert_if_missing(db, model, record: dict, **fields) -> bool:
    if db.get(model, uid(record["id"])):
        return False
    db.add(model(id=uid(record["id"]), **fields))
    return True


def main() -> None:
    fixture_path = REPOSITORY_DIR / "backend" / "fixtures" / "demo-data.json"
    data = json.loads(fixture_path.read_text(encoding="utf-8"))
    init_db()
    db = SessionLocal()
    inserted = 0

    try:
        for item in data["users"]:
            user_fields = {
                "email": item["email"], "username": item["username"],
                "first_name": item["first_name"], "last_name": item["last_name"],
                "password_hash": hash_password(item["password"]),
                "is_active": item["is_active"], "is_verified": item["is_verified"],
                "role": UserRole(item["role"]),
            }
            existing_user = db.get(User, uid(item["id"]))
            if existing_user:
                for field, value in user_fields.items():
                    setattr(existing_user, field, value)
            else:
                db.add(User(id=uid(item["id"]), **user_fields))
                inserted += 1
        db.flush()

        for item in data["organizations"]:
            inserted += insert_if_missing(db, Organization, item, name=item["name"], slug=item["slug"], description=item["description"], is_active=item["is_active"])
        db.flush()
        for item in data["organization_members"]:
            inserted += insert_if_missing(db, OrganizationMember, item, organization_id=uid(item["organization_id"]), user_id=uid(item["user_id"]), role=OrganizationRole(item["role"]))

        for item in data["projects"]:
            inserted += insert_if_missing(db, Project, item, name=item["name"], key=item["key"], description=item["description"], owner_id=uid(item["owner_id"]), is_active=item["is_active"])
        db.flush()
        for item in data["project_members"]:
            inserted += insert_if_missing(db, ProjectMember, item, project_id=uid(item["project_id"]), user_id=uid(item["user_id"]), role=ProjectRole(item["role"]))

        for item in data["sprints"]:
            inserted += insert_if_missing(db, Sprint, item, project_id=uid(item["project_id"]), name=item["name"], goal=item["goal"], start_date=as_date(item["start_date"]), end_date=as_date(item["end_date"]), is_active=item["is_active"])
        db.flush()
        for item in data["tasks"]:
            inserted += insert_if_missing(db, Task, item, project_id=uid(item["project_id"]), title=item["title"], description=item["description"], status=item["status"], priority=item["priority"], assignee_id=uid(item["assignee_id"]), created_by=uid(item["created_by"]), sprint_id=uid(item["sprint_id"]), due_date=as_date(item["due_date"]))
        db.flush()

        for item in data["attachments"]:
            inserted += insert_if_missing(db, TaskAttachment, item, task_id=uid(item["task_id"]), file_name=item["file_name"], content_type=item["content_type"], size_bytes=item["size_bytes"], uploaded_by=uid(item["uploaded_by"]), notes=item["notes"])
        for item in data["comments"]:
            inserted += insert_if_missing(db, Comment, item, task_id=uid(item["task_id"]), author_id=uid(item["author_id"]), content=item["content"])
        for item in data["history"]:
            inserted += insert_if_missing(db, TaskHistory, item, task_id=uid(item["task_id"]), changed_by=uid(item["changed_by"]), previous_status=item["previous_status"], new_status=item["new_status"], action=item["action"])
        for item in data["notifications"]:
            inserted += insert_if_missing(db, Notification, item, user_id=uid(item["user_id"]), task_id=uid(item["task_id"]), title=item["title"], message=item["message"], is_read=item["is_read"])

        db.commit()
        print(
            f"Demo seed completed: {inserted} records inserted. "
            "Login: demo-admin@smarttask.dev / Demo@123"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
