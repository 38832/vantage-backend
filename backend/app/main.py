import json
import time
from typing import Optional
from fastapi import FastAPI, Request, Response, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.core.auth import get_current_admin
from app.core.logger import (
    log_http_request,
    log_http_response,
    is_detailed_logging_enabled,
    set_detailed_logging,
)
from app.api.routes import health, jobs, applications, inquiries, admin, auth

app = FastAPI(
    title="UGETJOB — Global Workforce Solutions API",
    description="Backend API for overseas recruitment, candidate ATS pipeline, employer manpower requests, and Supabase integration.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration (SEC-02: Restricted strict origin policy)
# Disallow open multi-tenant wildcards (*.vercel.app, *.onrender.com).
# Allow exact origins from settings.cors_origins, official domain subdomains,
# and local development loopbacks.
ALLOWED_ORIGIN_REGEX = (
    r"^https://([a-zA-Z0-9-]+\.)*(ugetjob365\.com|ugetjob\.com)$"
    r"|^http://(localhost|127\.0\.0\.1)(:\d+)?$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ---------------------------------------------------------------------------
# SEC-08: Security Headers Middleware
# Injects defense-in-depth HTTP headers on every response to prevent
# clickjacking, MIME sniffing, XSS, and other browser-based attacks.
# ---------------------------------------------------------------------------
_SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    # Disable legacy XSS auditor — modern browsers rely on CSP instead
    "X-XSS-Protection": "0",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    # CSP for an API backend: restrictive default; no inline scripts needed.
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https:; "
        "connect-src 'self' https://vantage-backend-2b7h.onrender.com; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    ),
}

# HSTS is only safe when every sub-domain truly supports TLS.
# Enabled conditionally so local dev over plain HTTP is not broken.
_is_production = settings.environment.lower() in {"production", "prod", "staging"}


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Attach SEC-08 hardening headers to every HTTP response."""
    response = await call_next(request)
    for header_name, header_value in _SECURITY_HEADERS.items():
        response.headers[header_name] = header_value
    if _is_production:
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
    return response


@app.middleware("http")
async def detailed_terminal_logging_middleware(request: Request, call_next):
    """
    Dynamic ASGI middleware that prints full incoming request bodies,
    route path, query params, response duration, and response JSON payloads.
    Controlled dynamically by settings.enable_detailed_logs and set_detailed_logging().
    """
    if request.method == "OPTIONS" or not is_detailed_logging_enabled():
        return await call_next(request)

    start_time = time.perf_counter()
    content_type = request.headers.get("content-type", "")
    body_data = None

    # Safely inspect body without consuming multipart file upload streams
    if "application/json" in content_type:
        try:
            body_bytes = await request.body()
            if body_bytes:
                body_data = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            body_data = "[Unparseable or binary body]"
    elif "multipart/form-data" in content_type:
        body_data = "[Multipart form upload — file stream preserved for handler]"

    log_http_request(
        method=request.method,
        path=request.url.path,
        query_params=dict(request.query_params) if request.query_params else None,
        client_host=request.client.host if request.client else None,
        body=body_data,
        content_type=content_type or None
    )

    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    resp_content_type = response.headers.get("content-type", "")
    if "application/json" in resp_content_type:
        # Buffer and capture response JSON payload
        response_body_bytes = b""
        async for chunk in response.body_iterator:
            response_body_bytes += chunk

        try:
            resp_body = json.loads(response_body_bytes.decode("utf-8"))
        except Exception:
            resp_body = response_body_bytes.decode("utf-8", errors="replace")

        log_http_response(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            body=resp_body
        )

        return Response(
            content=response_body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )
    else:
        log_http_response(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            body=None
        )
        return response


# Register route blueprints
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication & Tokens"])
app.include_router(jobs.router, prefix="/api", tags=["Jobs & Categories"])
app.include_router(applications.router, prefix="/api", tags=["Applications & Candidates"])
app.include_router(inquiries.router, prefix="/api", tags=["Inquiries & Services"])
app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin & ATS"],
    dependencies=[Depends(get_current_admin)]
)



@app.get("/")
async def root():
    return {
        "app": "UGETJOB Backend API",
        "consultancy": "Nouman's Manpower Consultancy",
        "documentation": "/docs",
        "detailed_logging": "ENABLED" if is_detailed_logging_enabled() else "DISABLED",
        "status": "healthy"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)

