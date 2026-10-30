import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.application import ApplicationStatus

class CandidateBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    current_country: Optional[str] = None
    current_city: Optional[str] = None
    passport_status: Optional[str] = "ready"
    passport_number: Optional[str] = None
    passport_expiry: Optional[date] = None
    years_experience: Optional[int] = 0
    current_role: Optional[str] = None
    current_salary: Optional[float] = None
    preferred_country: Optional[str] = None
    preferred_city: Optional[str] = None
    preferred_job_category: Optional[str] = None
    visa_status: Optional[str] = "required"
    notice_period: Optional[str] = None
    willing_to_relocate: bool = True
    cover_letter: Optional[str] = None
    consent_to_contact: bool = True

class CandidateApplicationCreate(CandidateBase):
    job_id: Optional[uuid.UUID] = None
    resume_url: Optional[str] = None

class CandidateOut(CandidateBase):
    id: uuid.UUID
    has_resume: bool
    resume_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ATSNoteCreate(BaseModel):
    author_name: str
    note: str

class ATSNoteOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    author_name: str
    note: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApplicationUpdate(BaseModel):
    application_status: Optional[ApplicationStatus] = None
    recruiter_assigned: Optional[str] = None
    shortlisted_by: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_notes: Optional[str] = None
    document_status: Optional[str] = None
    medical_status: Optional[str] = None
    visa_status: Optional[str] = None
    notes: Optional[str] = None

class ApplicationOut(BaseModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    job_id: Optional[uuid.UUID] = None
    candidate_name: Optional[str] = None
    candidate_phone: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_nationality: Optional[str] = None
    candidate_role: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    application_status: ApplicationStatus
    recruiter_assigned: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_notes: Optional[str] = None
    document_status: Optional[str] = "pending"
    medical_status: Optional[str] = "pending"
    visa_status: Optional[str] = "not_started"
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ATSDashboardStats(BaseModel):
    total_applications: int
    new_applications: int
    contacted: int
    shortlisted: int
    interview_scheduled: int
    interviewed: int
    document_pending: int
    medical_pending: int
    visa_pending: int
    visa_approved: int
    hired: int
    rejected: int
