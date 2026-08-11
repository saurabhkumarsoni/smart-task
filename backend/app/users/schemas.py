import uuid

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr

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
