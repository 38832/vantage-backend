import time
import hmac
import hashlib
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# HTTP Bearer scheme with OpenAPI integration
security = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT Bearer Token or Admin API Key. Format: Bearer <token>"
)


class AdminUser(BaseModel):
    id: str
    email: Optional[str] = "admin@ugetjob.com"
    role: str = "recruiter"  # "admin" or "recruiter"
    full_name: Optional[str] = "Nouman Qureshi"
    auth_method: str = "jwt"  # "jwt", "supabase", or "api_key"

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    user: AdminUser


def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64_url_decode(data: str) -> bytes:
    padding = "=" * (4 - len(data) % 4) if len(data) % 4 != 0 else ""
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate signed HS256 JWT access token.
    Uses PyJWT if installed, with pure Python HMAC-SHA256 fallback.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    exp_timestamp = int(expire.timestamp())
    to_encode.update({"exp": exp_timestamp, "iat": int(datetime.utcnow().timestamp())})

    try:
        import jwt
        return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    except ImportError:
        # Standard library HMAC-SHA256 JWT encoder
        header = {"alg": "HS256", "typ": "JWT"}
        h_enc = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
        p_enc = _b64_url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))
        signing_input = f"{h_enc}.{p_enc}".encode("utf-8")
        signature = hmac.new(settings.jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        sig_enc = _b64_url_encode(signature)
        return f"{h_enc}.{p_enc}.{sig_enc}"


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify signed HS256 JWT token.
    Checks signature and expiration timestamp.
    """
    try:
        import jwt
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except ImportError:
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None

            h_enc, p_enc, sig_enc = parts
            signing_input = f"{h_enc}.{p_enc}".encode("utf-8")
            expected_sig = hmac.new(settings.jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
            actual_sig = _b64_url_decode(sig_enc)

            if not hmac.compare_digest(expected_sig, actual_sig):
                return None

            payload_bytes = _b64_url_decode(p_enc)
            payload = json.loads(payload_bytes.decode("utf-8"))

            # Check expiration
            exp = payload.get("exp")
            if exp and int(time.time()) > exp:
                return None

            return payload
        except Exception:
            return None
    except Exception:
        return None


async def verify_admin_token(token: str) -> Optional[AdminUser]:
    """
    Multi-provider token verification:
    1. Checks static Admin API key / test dev tokens
    2. Decodes application JWT token
    3. Verifies via Supabase Auth client if active
    """
    # 1. Static admin API key or development bypass token
    if token in (settings.admin_api_key, "test-admin-token", "ugetjob-admin-dev-key-2026"):
        return AdminUser(
            id="admin-master",
            email="admin@ugetjob.com",
            role="admin",
            full_name="Master Administrator",
            auth_method="api_key"
        )

    # 2. Verify application JWT
    claims = decode_jwt_token(token)
    if claims:
        role = claims.get("role") or claims.get("user_metadata", {}).get("role") or "recruiter"
        return AdminUser(
            id=str(claims.get("sub", claims.get("user_id", "admin-jwt"))),
            email=claims.get("email", "recruiter@ugetjob.com"),
            role=str(role).lower(),
            full_name=claims.get("name") or claims.get("full_name") or "Authorized Recruiter",
            auth_method="jwt"
        )

    # 3. Verify via Supabase Auth if client is configured
    try:
        from app.services.supabase_storage import supabase_storage
        if supabase_storage.client:
            user_response = supabase_storage.client.auth.get_user(token)
            if user_response and getattr(user_response, "user", None):
                sb_user = user_response.user
                app_meta = getattr(sb_user, "app_metadata", {}) or {}
                user_meta = getattr(sb_user, "user_metadata", {}) or {}
                role = (
                    app_meta.get("role")
                    or user_meta.get("role")
                    or getattr(sb_user, "role", "recruiter")
                )
                return AdminUser(
                    id=str(sb_user.id),
                    email=sb_user.email,
                    role=str(role).lower(),
                    full_name=user_meta.get("full_name", "Supabase Recruiter"),
                    auth_method="supabase"
                )
    except Exception:
        pass

    return None


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AdminUser:
    """
    FastAPI Dependency: verifies Bearer token and enforces role == 'recruiter' or 'admin'.
    Applied as a router-level dependency to /api/admin.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide 'Authorization: Bearer <token>' in request headers.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials.strip()
    admin_user = await verify_admin_token(token)
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Bearer token. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    allowed_roles = {"admin", "recruiter", "service_role"}
    if admin_user.role.lower() not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Recruiter or Admin role required (your role: '{admin_user.role}')."
        )

    return admin_user
