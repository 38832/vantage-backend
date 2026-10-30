from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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

# Register route blueprints
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(jobs.router, prefix="/api", tags=["Jobs & Categories"])
app.include_router(applications.router, prefix="/api", tags=["Applications & Candidates"])
app.include_router(inquiries.router, prefix="/api", tags=["Inquiries & Services"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin & ATS"])

@app.get("/")
async def root():
    return {
        "app": "UGETJOB Backend API",
        "consultancy": "Nouman's Manpower Consultancy",
        "documentation": "/docs",
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
