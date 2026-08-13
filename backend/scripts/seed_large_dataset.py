import random
import sys
from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4

from faker import Faker

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.auth.security import hash_password
from app.database import SessionLocal, init_db

from app.users.models import User, UserRole

from app.models.organization import Organization
from app.models.organization_member import (
    OrganizationMember,
    OrganizationRole,
)

from app.models.project import Project
from app.models.project_member import (
    ProjectMember,
    ProjectRole,
)

from app.models.sprint import Sprint
from app.models.task import Task
from app.models.comment import Comment
from app.models.notification import Notification
from app.models.task_history import TaskHistory

fake = Faker()


def main():

    init_db()

    db = SessionLocal()

    try:

        print("Creating Users...")

        users = []

        for i in range(100):

            user = User(
                id=uuid4(),
                email=f"user{i}@smarttask.dev",
                username=f"user{i}",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password_hash=hash_password("Password@123"),
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
            )

            db.add(user)
            users.append(user)

        db.flush()

        print("Creating Organizations...")

        organizations = []

        for i in range(50):

            org = Organization(
                id=uuid4(),
                name=f"Organization {i+1}",
                slug=f"org-{i+1}",
                description=fake.text(max_nb_chars=200),
                is_active=True,
            )

            db.add(org)
            organizations.append(org)

        db.flush()

        print("Creating Organization Members...")

        for org in organizations:

            selected_users = random.sample(users, 50)

            for user in selected_users:

                db.add(
                    OrganizationMember(
                        id=uuid4(),
                        organization_id=org.id,
                        user_id=user.id,
                        role=OrganizationRole.MEMBER,
                    )
                )

        db.flush()

        print("Creating Projects...")

        projects = []

        for i in range(100):

            owner = random.choice(users)

            project = Project(
                id=uuid4(),
                name=f"Project {i+1}",
                key=f"PRJ{i+1}",
                description=fake.text(max_nb_chars=500),
                owner_id=owner.id,
                is_active=True,
            )

            db.add(project)
            projects.append(project)

        db.flush()

        print("Creating Project Members...")

        for project in projects:

            selected_users = random.sample(users, 30)

            for user in selected_users:

                db.add(
                    ProjectMember(
                        id=uuid4(),
                        project_id=project.id,
                        user_id=user.id,
                        role=ProjectRole.MEMBER,
                    )
                )

        db.flush()

        print("Creating Sprints...")

        sprints = []

        for project in projects:

            for sprint_no in range(1, 10):

                sprint = Sprint(
                    id=uuid4(),
                    project_id=project.id,
                    name=f"Sprint {sprint_no}",
                    goal=fake.sentence(),
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=14),
                    is_active=True,
                )

                db.add(sprint)
                sprints.append(sprint)

        db.flush()

        print("Creating Tasks...")

        statuses = [
            "todo",
            "in_progress",
            "in_review",
            "done",
        ]

        priorities = [
            "low",
            "medium",
            "high",
            "critical",
        ]

        tasks = []

        for _ in range(15000):

            task = Task(
                id=uuid4(),
                project_id=random.choice(projects).id,
                title=fake.sentence(nb_words=6),
                description=fake.text(max_nb_chars=500),
                status=random.choices(
                    ["todo", "in_progress", "in_review", "done"],
                    weights=[30, 25, 15, 30],
                )[0],
                priority=random.choices(
                    ["low", "medium", "high", "critical"], weights=[20, 40, 30, 10]
                )[0],
                assignee_id=random.choice(users).id,
                created_by=random.choice(users).id,
                sprint_id=random.choice(sprints).id,
                due_date=date.today() + timedelta(days=random.randint(1, 60)),
            )

            db.add(task)
            tasks.append(task)

        db.flush()

        print("Creating Comments...")

        for _ in range(5000):

            db.add(
                Comment(
                    id=uuid4(),
                    task_id=random.choice(tasks).id,
                    author_id=random.choice(users).id,
                    content=fake.paragraph(),
                )
            )

        db.flush()

        print("Creating Task History...")

        for _ in range(150000):

            old_status = random.choice(statuses)

            db.add(
                TaskHistory(
                    id=uuid4(),
                    task_id=random.choice(tasks).id,
                    changed_by=random.choice(users).id,
                    previous_status=old_status,
                    new_status=random.choice(statuses),
                    action="updated",
                )
            )

        db.flush()

        print("Creating Notifications...")

        for _ in range(30000):

            db.add(
                Notification(
                    id=uuid4(),
                    user_id=random.choice(users).id,
                    task_id=random.choice(tasks).id,
                    title="Task Updated",
                    message=fake.sentence(),
                    is_read=random.choice([True, False]),
                )
            )

        db.commit()

        print("=" * 50)
        print("SEED COMPLETED SUCCESSFULLY")
        print("=" * 50)
        print("Users: 50")
        print("Organizations: 5")
        print("Projects: 20")
        print("Sprints: 60")
        print("Tasks: 1000")
        print("Comments: 5000")
        print("Task History: 10000")
        print("Notifications: 3000")
        print("=" * 50)

    except Exception as e:

        db.rollback()
        print(f"ERROR: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
