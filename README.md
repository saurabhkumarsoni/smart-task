# Smart Task

Smart Task is a FastAPI-based task and project collaboration backend for managing work across projects, sprints, dashboards, notifications, and activity history. It is designed to support team-style workflows with authentication, task lifecycle management, comments, attachments, and overview endpoints for both projects and workspaces.

## Project Overview

This project provides a backend foundation for a task management application with:

- User authentication and authorization
- Project and organization management
- Sprint planning support
- Task creation, updates, filtering, and workflow transitions
- Comments and task history tracking
- Notifications and background jobs
- Dashboard summaries and project/workspace overview endpoints

## Architecture

The backend is organized as a modular FastAPI application under the backend package:

- app/api: API router composition and health endpoints
- app/auth: authentication, JWT handling, login, refresh, logout, and password flows
- app/comments: task comments
- app/dashboards: dashboard summary endpoints
- app/jobs: background job registration and execution
- app/models: SQLAlchemy ORM models for users, projects, tasks, comments, organizations, sprints, notifications, and history
- app/notifications: in-app notification support
- app/organizations: organization and membership management
- app/projects: project CRUD and project/member management
- app/sprints: sprint lifecycle and task assignment
- app/tasks: task CRUD, filtering, workflow validation, and detail endpoints
- app/task_history: task activity and history tracking
- app/schemas: request and response schemas for the API
- app/database.py: database session and base model configuration
- app/config.py: environment-driven settings

## Tech Stack

- Python 3.13+
- FastAPI
- SQLAlchemy 2.x
- Pydantic 2.x
- Alembic for database migrations
- PostgreSQL-ready configuration
- JWT-based authentication
- pytest for automated tests
- Uvicorn for local development

## Project Structure

```text
smart-task/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── dashboards/
│   │   ├── jobs/
│   │   ├── models/
│   │   ├── notifications/
│   │   ├── organizations/
│   │   ├── projects/
│   │   ├── schemas/
│   │   ├── sprints/
│   │   ├── tasks/
│   │   ├── task_history/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── alembic.ini
├── docker-compose.yml
├── .env.example
└── README.md
```

## Environment Setup

1. Create a virtual environment

   ```bash
   python -m venv .venv
   ```

2. Activate it

   ```bash
   .venv\Scripts\activate
   ```

3. Install dependencies

   ```bash
   pip install -r backend/requirements.txt
   ```

4. Copy environment variables

   ```bash
   copy .env.example .env
   ```

5. Update the values in .env as needed for your local environment.

## Running the Application

### Run locally with Uvicorn

From the project root:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Run with Docker Compose

```bash
docker compose up --build
```

## API Highlights

The API is mounted under the main router and includes routes for:

- Authentication: login, refresh, logout, password change, reset flows
- Projects: create, list, update, delete, members
- Tasks: create, update, delete, transition status, filters, pagination
- Comments: add and manage discussion on tasks
- Notifications: unread counts and notification summaries
- Sprints: create and manage sprint-related task assignments
- Dashboards: task and deadline summaries
- Activity history: task change tracking

## Testing

Run the test suite with:

```bash
cd backend
pytest -q
```

Or from the project root:

```bash
python -m pytest -q
```

## Demo data

After applying migrations, load a complete API-ready workspace with:

```bash
.venv\Scripts\python.exe backend/scripts/seed_demo_data.py
```

The fixture is [backend/fixtures/demo-data.json](backend/fixtures/demo-data.json). It is idempotent and adds users, organizations, memberships, projects, sprints, tasks in every workflow status, attachments, comments, history, and notifications. Use `demo-admin@smarttask.dev` with password `Demo@123` to log in.

## Database Migrations

The project uses Alembic for schema migrations.

Example:

```bash
cd backend
alembic upgrade head
```

## Notes

This repository is a backend-first implementation of a collaborative task management system. It is ready for expansion with frontend integration, richer analytics, and additional workflow automation.
