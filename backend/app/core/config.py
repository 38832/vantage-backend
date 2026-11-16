import secrets
from typing import List
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "ugetjob-backend"
    environment: str = "development"
    port: int = 8000
    
    # Supabase / Postgres Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ugetjob"
    
    # Supabase Storage & Client
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""
    
    candidate_resumes_bucket: str = "candidate-resumes"
    company_documents_bucket: str = "company-documents"
    job_attachments_bucket: str = "job-attachments"
    
    # CORS & Security Secrets
    allowed_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,"
        "https://ugetjob365.com,https://www.ugetjob365.com,"
        "https://ugetjob.com,https://www.ugetjob.com"
    )
    secret_key: str = "secret-key-change-me"

    # JWT & RBAC Authentication
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # Detailed Console Logging Toggle
    # Set to True to print full request/response bodies, sorting criteria, and mutation diffs in terminal
    enable_detailed_logs: bool = True
    log_payload_max_bytes: int = 25000

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        weak_placeholders = {
            "secret",
            "jwt-secret",
            "secret-key-change-me",
            "replace-with-a-long-random-secret",
            "replace-with-a-random-secret",
            "your-service-role-key",
            "changeme",
            "admin",
            "password",
        }
        if self.jwt_secret and self.jwt_secret.strip().lower() in weak_placeholders:
            raise ValueError(f"JWT_SECRET cannot be a known default placeholder: '{self.jwt_secret}'")

        if (self.environment or "").lower() == "production":
            if not self.jwt_secret or len(self.jwt_secret) < 32:
                raise ValueError("In production, JWT_SECRET must be configured with at least 32 characters.")
            if not self.secret_key or self.secret_key.strip().lower() in weak_placeholders:
                raise ValueError("In production, SECRET_KEY must be configured with a strong non-default value.")
            if self.supabase_service_role_key and self.supabase_service_role_key.strip().lower() in weak_placeholders:
                raise ValueError("In production, SUPABASE_SERVICE_ROLE_KEY cannot use an example placeholder value.")
        return self

    @property
    def cors_origins(self) -> List[str]:
        raw = self.allowed_origins or ""
        origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
        defaults = [
            "https://ugetjob365.com",
            "https://www.ugetjob365.com",
            "https://ugetjob.com",
            "https://www.ugetjob.com",
            "https://ugetjob.vercel.app",
            "https://vantage2.vercel.app",
            "https://vantage-backend-2b7h.onrender.com",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
