from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from app.auth.email_service import EmailService
from app.auth.jwt import create_access_token
from app.auth.jwt import create_password_reset_token
from app.auth.jwt import create_refresh_token
from app.auth.jwt import create_verification_token
from app.auth.security import hash_password
from app.auth.security import verify_password

from app.users.models import User, UserRole
from app.users.repository import UserRepository
from app.users.schemas import UserRegister


class AuthService:

    def __init__(self, db: Session):

        self.user_repository = UserRepository(db)

    def register(
        self,
        data: UserRegister,
    ) -> User:

        existing_email = self.user_repository.get_by_email(data.email)

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        existing_username = self.user_repository.get_by_username(data.username)

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already registered",
            )

        user = User(
            email=data.email,
            username=data.username,
            first_name=data.first_name,
            last_name=data.last_name,
            password_hash=hash_password(data.password),
        )

        return self.user_repository.create(user)

    def authenticate(
        self,
        email: str,
        password: str,
    ) -> User:

        user = self.user_repository.get_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(
            password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        return user

    def create_access_token(
        self,
        user: User,
    ) -> str:

        return create_access_token(str(user.id))

    def create_refresh_token(
        self,
        user: User,
    ) -> str:

        return create_refresh_token(str(user.id))

    def create_verification_token(
        self,
        user: User,
    ) -> str:

        token = create_verification_token(str(user.id))
        EmailService.send_verification_email(user.email, token)
        return token

    def create_password_reset_token(
        self,
        user: User,
    ) -> str:

        token = create_password_reset_token(str(user.id))
        EmailService.send_password_reset_email(user.email, token)
        return token

    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> User:

        if not verify_password(
            current_password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )

        if current_password == new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from the current password",
            )

        user.password_hash = hash_password(new_password)
        self.user_repository.db.commit()
        self.user_repository.db.refresh(user)

        return user

    def verify_email(self, user: User) -> User:
        if user.is_verified:
            return user

        user.is_verified = True
        self.user_repository.db.commit()
        self.user_repository.db.refresh(user)

        return user

    def reset_password(self, user: User, new_password: str) -> User:
        user.password_hash = hash_password(new_password)
        self.user_repository.db.commit()
        self.user_repository.db.refresh(user)

        return user

    def activate_account(self, user: User, is_active: bool) -> User:
        if user.is_active == is_active:
            return user

        user.is_active = is_active
        self.user_repository.db.commit()
        self.user_repository.db.refresh(user)

        return user
