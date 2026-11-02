import uuid
from datetime import datetime
from typing import Optional, List
import re
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.job import JobStatus

class JobCategoryBase(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None

class JobCategoryOut(JobCategoryBase):
    id: uuid.UUID
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class JobBase(BaseModel):
    category_id: uuid.UUID
    title: str
    company_name: str
    location_country: str
    location_city: Optional[str] = None
    work_location_type: str = "overseas"
    visa_required: bool = False
    visa_type: Optional[str] = None
    employment_type: str = "full_time"
    experience_min: int = 0
    experience_max: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "INR"
    job_description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    urgent: bool = False
    featured: bool = False
    skills: List[str] = Field(default_factory=list)
    openings_count: int = 1

class JobCreate(JobBase):
    employer_contact_name: Optional[str] = None
    employer_email: Optional[str] = None
    employer_phone: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_preference: Optional[str] = None
    nationality_preference: Optional[str] = None
    deadline: Optional[datetime] = None
    salary: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def parse_salary_text(cls, values):
        if isinstance(values, dict) and values.get("salary") and not values.get("salary_min"):
            salary_text = str(values["salary"]).strip()
            currency_match = re.match(r"^([A-Za-z]{3})\b", salary_text)
            if currency_match and not values.get("salary_currency"):
                values["salary_currency"] = currency_match.group(1).upper()

            amounts = [
                float(value.replace(",", ""))
                for value in re.findall(r"\d+(?:,\d{3})*(?:\.\d+)?", salary_text)
            ]
            if amounts:
                values["salary_min"] = amounts[0]
                if len(amounts) > 1:
                    values["salary_max"] = amounts[1]
        return values

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
