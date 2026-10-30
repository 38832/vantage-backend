import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, DateTime, Date
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    passport_status: Mapped[Optional[str]] = mapped_column(String(50), default="ready", nullable=True)
    passport_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    passport_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    current_role: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    current_salary: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    
    preferred_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_job_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(50), default="required", nullable=True)
    notice_period: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    willing_to_relocate: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    has_resume: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resume_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="website", nullable=False)
    consent_to_contact: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    applications: Mapped[List["Application"]] = relationship("Application", back_populates="candidate")
    documents: Mapped[List["ApplicationDocument"]] = relationship("ApplicationDocument", back_populates="candidate")
