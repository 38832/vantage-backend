import json
import time
from typing import Optional
from fastapi import FastAPI, Request, Response, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.core.logger import (
    log_http_request,
    log_http_response,
    is_detailed_logging_enabled,
    set_detailed_logging,
)
from app.api.routes import health, jobs, applications, inquiries, admin

app = FastAPI(
    title="UGETJOB — Global Workforce Solutions API",
    description="Backend API for overseas recruitment, candidate ATS pipeline, employer manpower requests, and Supabase integration.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def detailed_terminal_logging_middleware(request: Request, call_next):
    """
    Dynamic ASGI middleware that prints full incoming request bodies,
    route path, query params, response duration, and response JSON payloads.
    Controlled dynamically by settings.enable_detailed_logs and set_detailed_logging().
    """
    if not is_detailed_logging_enabled():
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
app.include_router(jobs.router, prefix="/api", tags=["Jobs & Categories"])
app.include_router(applications.router, prefix="/api", tags=["Applications & Candidates"])
app.include_router(inquiries.router, prefix="/api", tags=["Inquiries & Services"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin & ATS"])


class LogTogglePayload(BaseModel):
    enabled: bool


@app.get("/api/admin/logging", tags=["Admin & ATS"])
async def get_logging_status():
    """
    Check current dynamic logging level and settings configuration.
    """
    return {
        "success": True,
        "detailed_logs_enabled": is_detailed_logging_enabled(),
        "configured_default": settings.enable_detailed_logs,
        "message": "Detailed terminal console logging is ON" if is_detailed_logging_enabled() else "Detailed terminal console logging is OFF"
    }


@app.post("/api/admin/logging/toggle", tags=["Admin & ATS"])
async def toggle_logging(payload: LogTogglePayload):
    """
    Dynamically turn detailed terminal console logging ON or OFF at runtime.
    """
    new_state = set_detailed_logging(payload.enabled)
    return {
        "success": True,
        "detailed_logs_enabled": new_state,
        "message": f"Detailed terminal logging set to {new_state}"
    }


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

