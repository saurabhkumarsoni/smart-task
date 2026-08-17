import uuid

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.users.models import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    role: UserRole
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
