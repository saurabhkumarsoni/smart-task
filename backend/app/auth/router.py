from fastapi import APIRouter
from fastapi import Depends

from app.auth.blacklist import TokenBlacklist
from app.auth.dependencies import get_current_user, require_role
from app.auth.schemas import ActivateAccountRequest
from app.auth.schemas import ChangePasswordRequest
from app.auth.schemas import ForgotPasswordRequest
from app.auth.schemas import LoginRequest
from app.auth.schemas import RefreshTokenRequest
from app.auth.schemas import ResetPasswordRequest
from app.auth.schemas import TokenResponse
from app.auth.schemas import VerifyEmailRequest
from app.auth.service import AuthService
from app.schemas.user_preference import UserPreferenceRead, UserPreferenceUpdate

from app.database import get_db
from app.auth.jwt import decode_token
from app.users.models import User, UserRole
from app.users.schemas import UserProfileUpdate, UserRegister
from fastapi import HTTPException
from app.users.schemas import UserResponse

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register(
    data: UserRegister,
    db=Depends(get_db),
):

    service = AuthService(db)

    return service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db=Depends(get_db),
):

    service = AuthService(db)

    user = service.authenticate(
        email=data.email,
        password=data.password,
    )

    access_token = service.create_access_token(user)
    refresh_token = service.create_refresh_token(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh_token(
    data: RefreshTokenRequest,
    db=Depends(get_db),
):

    if TokenBlacklist.contains(data.refresh_token):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    try:
        payload = decode_token(data.refresh_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    service = AuthService(db)
    user = service.user_repository.get_by_id(user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = service.create_access_token(user)
    refresh_token_value = service.create_refresh_token(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_value,
        token_type="bearer",
        user=user,
    )


@router.post(
    "/logout",
    status_code=200,
)
def logout(
    data: RefreshTokenRequest,
):

    if not data.refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")

    TokenBlacklist.add(data.refresh_token)

    return {"message": "Logged out successfully"}


@router.put(
    "/me",
    response_model=UserResponse,
)
def update_me(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):

    service = AuthService(db)
    return service.update_profile(current_user, data)


@router.get("/me/preferences", response_model=UserPreferenceRead)
def get_my_preferences(
    current_user: User = Depends(get_current_user), db=Depends(get_db)
):
    return AuthService(db).get_preferences(current_user)


@router.patch("/me/preferences", response_model=UserPreferenceRead)
def update_my_preferences(
    data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    return AuthService(db).update_preferences(current_user, data)


@router.post(
    "/change-password",
    response_model=UserResponse,
)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):

    service = AuthService(db)

    return service.change_password(
        current_user,
        data.current_password,
        data.new_password,
    )


@router.post(
    "/verify-email",
    response_model=UserResponse,
)
def verify_email(
    data: VerifyEmailRequest,
    db=Depends(get_db),
):

    try:
        payload = decode_token(data.token)
    except Exception as exc:
        raise HTTPException(
            status_code=401, detail="Invalid verification token"
        ) from exc

    if payload.get("type") != "verification":
        raise HTTPException(status_code=401, detail="Invalid verification token")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid verification token")

    service = AuthService(db)
    user = service.user_repository.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return service.verify_email(user)


@router.post(
    "/forgot-password",
    status_code=200,
)
def forgot_password(
    data: ForgotPasswordRequest,
    db=Depends(get_db),
):

    service = AuthService(db)
    user = service.user_repository.get_by_email(data.email)

    if not user:
        return {"message": "If an account exists, a reset link was generated"}

    reset_token = service.create_password_reset_token(user)

    return {
        "message": "If an account exists, a reset link was generated",
        "reset_token": reset_token,
    }


@router.post(
    "/reset-password",
    response_model=UserResponse,
)
def reset_password(
    data: ResetPasswordRequest,
    db=Depends(get_db),
):

    try:
        payload = decode_token(data.token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid reset token") from exc

    if payload.get("type") != "password_reset":
        raise HTTPException(status_code=401, detail="Invalid reset token")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid reset token")

    service = AuthService(db)
    user = service.user_repository.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return service.reset_password(user, data.new_password)


@router.get(
    "/admin-check",
    response_model=UserResponse,
)
def admin_check(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):

    return current_user


@router.post(
    "/activate-account",
    response_model=UserResponse,
)
def activate_account(
    data: ActivateAccountRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db=Depends(get_db),
):

    service = AuthService(db)

    return service.activate_account(current_user, data.target_email, data.is_active)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):

    return current_user
