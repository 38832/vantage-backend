from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "ugetjob-backend"
    environment: str = "development"
    port: int = 8000
    
    # Supabase / Postgres Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ugetjob"
    
    # Supabase Storage & Client
    supabase_url: str = "https://example.supabase.co"
    supabase_key: str = "anon-key"
    supabase_service_role_key: str = "service-role-key"
    
    candidate_resumes_bucket: str = "candidate-resumes"
    company_documents_bucket: str = "company-documents"
    job_attachments_bucket: str = "job-attachments"
    
    # CORS
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://ugetjob.com,https://www.ugetjob.com"
    secret_key: str = "secret-key-change-me"

    # Detailed Console Logging Toggle
    # Set to True to print full request/response bodies, sorting criteria, and mutation diffs in terminal
    enable_detailed_logs: bool = True
    log_payload_max_bytes: int = 25000

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
