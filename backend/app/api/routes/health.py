import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.services.supabase_storage import supabase_storage

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    storage_status = (
        "configured"
        if supabase_storage.client is not None
        else ("mock" if settings.mock_storage else "unconfigured")
    )
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check database connectivity probe failed")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "service": settings.app_name,
                "environment": settings.environment,
                "database": "unreachable",
                "storage": storage_status,
            },
        )

    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "database": "ok",
        "storage": storage_status,
    }
