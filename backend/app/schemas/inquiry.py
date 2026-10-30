import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class EmployerInquiryCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str
    requirement_type: str = "manpower"
    industry: Optional[str] = None
    job_title: Optional[str] = None
    number_of_positions: Optional[int] = 1
    country: Optional[str] = None
    city: Optional[str] = None
    work_location: Optional[str] = "overseas"
    budget_range: Optional[str] = None
    urgency: Optional[str] = "normal"
    timeline: Optional[str] = None
    notes: Optional[str] = None

class EmployerInquiryOut(EmployerInquiryCreate):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ServiceRequestCreate(BaseModel):
    service_type: str # recruitment, documentation, visa, mobilization
    company_name: Optional[str] = None
    contact_name: str
    email: EmailStr
    phone: str
    city: Optional[str] = None
    notes: Optional[str] = None

class ServiceRequestOut(ServiceRequestCreate):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
