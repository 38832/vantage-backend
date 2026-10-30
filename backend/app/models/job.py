import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, DateTime, ForeignKey,
    Enum as SQLEnum, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from app.db.base import Base

class JobStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    paused = "paused"
    closed = "closed"
    filled = "filled"

class JobCategory(Base):
    __tablename__ = "job_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parent_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("job_categories.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="category")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("job_categories.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    employer_contact_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    employer_email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    employer_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    location_country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_location_type: Mapped[str] = mapped_column(String(50), default="overseas", nullable=False)
    
    visa_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    visa_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(50), default="full_time", nullable=False)
    
    experience_min: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    experience_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender_preference: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    nationality_preference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    salary_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    benefits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    urgent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    skills: Mapped[List[str]] = mapped_column(ARRAY(String).with_variant(JSON, "sqlite"), default=list, nullable=False)
    openings_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status"),
        default=JobStatus.published,
        nullable=False,
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category: Mapped["JobCategory"] = relationship("JobCategory", back_populates="jobs")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="job")
