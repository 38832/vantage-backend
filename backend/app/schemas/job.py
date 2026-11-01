import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.job import JobStatus

class JobCategoryBase(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None

class JobCategoryOut(JobCategoryBase):
    id: uuid.UUID
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

from typing import Optional, List, Union

class JobBase(BaseModel):
    category_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    company_name: Optional[str] = None
    location_country: Optional[str] = None
    location_city: Optional[str] = None
    work_location_type: str = "overseas"
    visa_required: bool = True
    visa_type: Optional[str] = None
    employment_type: str = "full_time"
    experience_min: int = 0
    experience_max: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "SAR"
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    urgent: bool = False
    featured: bool = False
    skills: Union[List[str], str] = []
    openings_count: int = 1

class JobCreate(JobBase):
    # Flexible field aliases to support various frontend submission keys
    category: Optional[str] = None
    job_title: Optional[str] = None
    position: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    employer_name: Optional[str] = None
    employer_contact_name: Optional[str] = None
    employer_email: Optional[str] = None
    employer_phone: Optional[str] = None
    country: Optional[str] = None
    destination: Optional[str] = None
    city: Optional[str] = None
    experience_years: Optional[int] = None
    years_experience: Optional[int] = None
    experience: Optional[Union[int, str]] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    requirement: Optional[str] = None
    perks: Optional[str] = None
    openings: Optional[int] = None
    vacancies: Optional[int] = None
    status: Optional[Union[JobStatus, str]] = JobStatus.published
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_preference: Optional[str] = None
    nationality_preference: Optional[str] = None
    deadline: Optional[datetime] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[JobStatus] = None
    urgent: Optional[bool] = None
    featured: Optional[bool] = None
    openings_count: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None

class JobListItemOut(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    title: str
    company_name: str
    location_country: str
    location_city: Optional[str] = None
    employment_type: str
    visa_required: bool
    experience_min: int
    experience_max: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str
    urgent: bool
    featured: bool
    status: JobStatus
    posted_at: datetime
    skills: List[str] = []
    openings_count: int

    model_config = ConfigDict(from_attributes=True)

class JobDetailOut(JobListItemOut):
    work_location_type: str
    visa_type: Optional[str] = None
    job_description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    employer_contact_name: Optional[str] = None
    employer_email: Optional[str] = None
    employer_phone: Optional[str] = None
    deadline: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
