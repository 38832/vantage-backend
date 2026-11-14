import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AuthApiError, AuthError, AuthInvalidCredentialsError, AuthRetryableError
from pydantic import BaseModel, ConfigDict

from app.core.config import settings
from app.services.supabase_storage import supabase_storage

security = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="Signed staff access token",
)


class AdminUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: str
    full_name: Optional[str] = None
    auth_method: str = "jwt"

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    user: AdminUser


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    payload = data.copy()
    now = datetime.now(timezone.utc)
    expires_at = now + (expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes))
    payload.update({"exp": int(expires_at.timestamp()), "iat": int(now.timestamp())})
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except (jwt.InvalidTokenError, TypeError, ValueError, OverflowError):
        return None


async def verify_admin_token(token: str) -> Optional[AdminUser]:
    claims = decode_jwt_token(token)
    if claims:
        role = claims.get("role")
        subject = claims.get("sub")
        if (
            not isinstance(role, str)
            or not role.strip()
            or not isinstance(subject, str)
            or not subject.strip()
        ):
            return None

        return AdminUser(
            id=subject,
            email=claims.get("email"),
            role=role.lower(),
            full_name=claims.get("name") or claims.get("full_name"),
            auth_method="jwt",
        )

    if not supabase_storage.client:
        return None

    try:
        user_response = await asyncio.to_thread(supabase_storage.client.auth.get_user, token)
    except AuthRetryableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Identity provider is temporarily unavailable.",
        ) from exc
    except (AuthApiError, AuthInvalidCredentialsError):
        return None
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Identity provider could not verify the access token.",
        ) from exc

    sb_user = getattr(user_response, "user", None)
    if not sb_user:
        return None

    app_metadata = getattr(sb_user, "app_metadata", {}) or {}
    role = app_metadata.get("role")
    if not isinstance(role, str) or role.lower() not in {"admin", "recruiter"}:
        return None

    user_metadata = getattr(sb_user, "user_metadata", {}) or {}
    return AdminUser(
        id=str(sb_user.id),
        email=sb_user.email,
        role=role.lower(),
        full_name=user_metadata.get("full_name"),
        auth_method="supabase",
    )


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AdminUser:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a Bearer access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_user = await verify_admin_token(credentials.credentials.strip())
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if admin_user.role.lower() not in {"admin", "recruiter"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Admin or recruiter role required (your role: '{admin_user.role}').",
        )

    return admin_user
