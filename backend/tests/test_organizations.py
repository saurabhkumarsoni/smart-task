from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, OrganizationRole
from app.organizations.service import OrganizationService
from app.users.models import User


def test_create_and_list_organizations_for_user():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    user = User(
        email="org@example.com",
        username="orguser",
        first_name="Org",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    session.flush()

    service = OrganizationService(session)
    org = service.create_organization(
        data={"name": "Acme", "slug": "acme", "description": "Ops"},
        current_user=user,
    )

    orgs = service.get_user_organizations(user)

    assert org.name == "Acme"
    assert len(orgs) == 1
    assert orgs[0].id == org.id

    session.close()


def test_add_and_update_organization_member():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)

    owner = User(
        email="owner@example.com",
        username="owner",
        first_name="Owner",
        last_name="User",
        password_hash="hash",
    )
    member = User(
        email="member@example.com",
        username="member",
        first_name="Member",
        last_name="User",
        password_hash="hash",
    )
    session.add_all([owner, member])
    session.flush()

    service = OrganizationService(session)
    org = service.create_organization(
        data={"name": "Beta", "slug": "beta"},
        current_user=owner,
    )

    added_member = service.add_member(
        org.id, {"user_id": member.id, "role": OrganizationRole.MEMBER}
    )
    updated_member = service.update_member_role(
        org.id, member.id, {"role": OrganizationRole.ADMIN}
    )

    assert added_member.user_id == member.id
    assert updated_member.role == OrganizationRole.ADMIN

    members = service.get_members(org.id)
    assert len(members) == 2

    session.close()
