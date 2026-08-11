from app.auth.jwt import create_refresh_token, decode_token


def test_refresh_token_contains_refresh_claims():
    token = create_refresh_token("user-123")
    payload = decode_token(token)

    assert payload["sub"] == "user-123"
    assert payload["type"] == "refresh"
