from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import create_access_token, require_admin
from app.config import Settings, get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class MeResponse(BaseModel):
    username: str
    role: str = "admin"


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, settings: Settings = Depends(get_settings)) -> TokenResponse:
    if payload.username != settings.admin_username or payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nieprawidłowy login lub hasło")
    token = create_access_token(payload.username, settings)
    return TokenResponse(access_token=token, username=payload.username)


@router.get("/me", response_model=MeResponse)
async def me(username: str = Depends(require_admin)) -> MeResponse:
    return MeResponse(username=username)
