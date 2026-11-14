import asyncio
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from supabase import (
    AuthApiError,
    AuthError,
    AuthInvalidCredentialsError,
    AuthRetryableError,
    create_client,
)
from supabase._sync.client import SupabaseException

from app.core.auth import (
    AdminUser,
    TokenResponse,
    create_access_token,
    security,
    verify_admin_token,
)
from app.core.config import settings
from app.schemas.response import ApiResponse

router = APIRouter()


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(payload: LoginPayload):
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff authentication is not configured.",
        )

    try:
        auth_client = create_client(settings.supabase_url, settings.supabase_key)
    except SupabaseException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff authentication is not configured correctly.",
        ) from exc

    try:
        auth_response = await asyncio.to_thread(
            auth_client.auth.sign_in_with_password,
            {"email": str(payload.email), "password": payload.password},
        )
    except AuthRetryableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Identity provider is temporarily unavailable.",
        ) from exc
    except (AuthApiError, AuthInvalidCredentialsError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Identity provider could not complete sign-in.",
        ) from exc

    user = auth_response.user
    if not user or not auth_response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    app_metadata = user.app_metadata or {}
    role = app_metadata.get("role")
    if not isinstance(role, str) or role.lower() not in {"admin", "recruiter"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not authorized for staff access.",
        )
    role = role.lower()

    user_metadata = user.user_metadata or {}
    full_name = user_metadata.get("full_name") or user_metadata.get("name")
    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": role,
            "name": full_name,
        },
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )
    admin_user = AdminUser(
        id=str(user.id),
        email=user.email,
        role=role,
        full_name=full_name,
    )

    return ApiResponse.ok(
        TokenResponse(
            access_token=access_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
            role=role,
            user=admin_user,
        )
    )


@router.get("/verify", response_model=ApiResponse[AdminUser])
async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await verify_admin_token(credentials.credentials.strip())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token is invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return ApiResponse.ok(user)
