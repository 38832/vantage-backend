import asyncio
import logging
from datetime import timedelta
from typing import Any, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from supabase import (
    AuthApiError,
    AuthError,
    AuthInvalidCredentialsError,
    AuthRetryableError,
    ClientOptions,
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
logger = logging.getLogger("ugetjob.auth")

# Module-level cache for initialized Supabase auth client: (url, key, create_client_id) -> client
_cached_client_entry: Optional[Tuple[str, str, int, Any]] = None


def mask_email(email: str) -> str:
    """Mask email for safe audit logs without revealing PII."""
    if not email or "@" not in email:
        return "***"
    user, domain = email.split("@", 1)
    if not user:
        return f"***@{domain}"
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[:2] + "*" * (len(user) - 2)
    return f"{masked_user}@{domain}"


def _resolve_supabase_auth_key() -> Optional[str]:
    """
    Select the appropriate Supabase authentication key.
    Prioritizes a valid JWT/service_role key if supabase_key starts with
    'sb_publishable_' which older Gotrue client libraries reject as invalid JWTs.
    """
    key = settings.supabase_key.strip() if settings.supabase_key else ""
    service_key = settings.supabase_service_role_key.strip() if settings.supabase_service_role_key else ""

    if key and not key.startswith("sb_publishable_"):
        return key
    if service_key:
        return service_key
    return key or None


def get_supabase_auth_client() -> Any:
    """
    Get or create a cached Supabase client for authentication operations.
    Avoids re-instantiating HTTP connection pools and eliminates exception cycles.
    """
    global _cached_client_entry

    if not settings.supabase_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff authentication is not configured.",
        )

    auth_key = _resolve_supabase_auth_key()
    if not auth_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff authentication is not configured.",
        )

    create_client_id = id(create_client)
    if (
        _cached_client_entry is not None
        and _cached_client_entry[0] == settings.supabase_url
        and _cached_client_entry[1] == auth_key
        and _cached_client_entry[2] == create_client_id
    ):
        return _cached_client_entry[3]

    client_options = ClientOptions(auto_refresh_token=False, persist_session=False)

    try:
        try:
            client = create_client(settings.supabase_url, auth_key, options=client_options)
        except TypeError:
            client = create_client(settings.supabase_url, auth_key)
        _cached_client_entry = (settings.supabase_url, auth_key, create_client_id, client)
        return client
    except SupabaseException:
        # Fallback to service role key if auth_key was not already service role key
        if settings.supabase_service_role_key and auth_key != settings.supabase_service_role_key:
            try:
                fallback_key = settings.supabase_service_role_key.strip()
                try:
                    client = create_client(settings.supabase_url, fallback_key, options=client_options)
                except TypeError:
                    client = create_client(settings.supabase_url, fallback_key)
                _cached_client_entry = (settings.supabase_url, fallback_key, create_client_id, client)
                return client
            except SupabaseException as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Staff authentication is not configured correctly.",
                ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff authentication is not configured correctly.",
        )


def _reset_cached_client() -> None:
    """Internal helper to reset the cached client (used in test fixtures if needed)."""
    global _cached_client_entry
    _cached_client_entry = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(payload: LoginPayload, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    safe_email = mask_email(str(payload.email))
    logger.info(f"[AUTH ATTEMPT] Staff login initiated for {safe_email} from IP {client_ip}")

    auth_client = get_supabase_auth_client()

    try:
        auth_response = await asyncio.to_thread(
            auth_client.auth.sign_in_with_password,
            {"email": str(payload.email), "password": payload.password},
        )
    except AuthRetryableError as exc:
        logger.error(f"[AUTH ERROR] Identity provider temporarily unavailable for {safe_email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Identity provider is temporarily unavailable.",
        ) from exc
    except (AuthApiError, AuthInvalidCredentialsError) as exc:
        if getattr(exc, "status", None) == 429 or getattr(exc, "code", None) == 429:
            logger.warning(f"[AUTH RATE_LIMIT] Supabase rate limit for {safe_email} from IP {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Please wait a moment and try again.",
            ) from exc
        logger.warning(f"[AUTH REJECTED] Invalid credentials for {safe_email} from IP {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except AuthError as exc:
        logger.error(f"[AUTH ERROR] Identity provider failed for {safe_email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Identity provider could not complete sign-in.",
        ) from exc

    user = auth_response.user
    if not user or not auth_response.session:
        logger.warning(f"[AUTH REJECTED] Empty user/session for {safe_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    app_metadata = user.app_metadata or {}
    role = app_metadata.get("role")
    if not isinstance(role, str) or role.lower() not in {"admin", "recruiter"}:
        logger.warning(f"[AUTH FORBIDDEN] Non-staff role '{role}' for user_id={user.id}")
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

    logger.info(f"[AUTH SUCCESS] Staff session issued for {safe_email} (role={role}, user_id={user.id})")

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
