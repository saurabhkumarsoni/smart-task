from fastapi import APIRouter

from app.api.health import router as health_router
from app.auth.router import router as auth_router
from app.comments.router import router as comment_router
from app.jobs.router import router as job_router
from app.dashboards.router import router as dashboard_router, workspace_router
from app.notifications.router import router as notification_router
from app.organizations.router import router as organization_router
from app.projects.router import router as project_router
from app.sprints.router import router as sprint_router
from app.tasks.router import router as task_router
from app.task_history.router import router as task_history_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(organization_router, prefix="/api/v1")
api_router.include_router(project_router, prefix="/api/v1")
api_router.include_router(sprint_router, prefix="/api/v1")
api_router.include_router(dashboard_router, prefix="/api/v1")
api_router.include_router(workspace_router, prefix="/api/v1")
api_router.include_router(task_router, prefix="/api/v1")
api_router.include_router(comment_router, prefix="/api/v1")
api_router.include_router(task_history_router, prefix="/api/v1")
api_router.include_router(notification_router, prefix="/api/v1")
api_router.include_router(job_router, prefix="/api/v1")
