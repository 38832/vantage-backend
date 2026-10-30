from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "database": "postgresql-asyncpg",
        "storage": "supabase"
    }
