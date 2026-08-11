from app.auth.jwt import create_access_token, decode_token
from app.users.models import User, UserRole


def test_access_token_contains_user_subject():
    token = create_access_token("user-123")
    payload = decode_token(token)

    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_user_role_defaults_to_user():
    user = User(
        username="demo",
        email="demo@example.com",
        first_name="Demo",
        last_name="User",
        password_hash="hash",
        role=UserRole.USER,
    )

    assert user.role == UserRole.USER
