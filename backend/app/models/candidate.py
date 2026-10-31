import uuid
from datetime import datetime, date
from typing import Optional, List
import enum
from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, DateTime, Date, BigInteger,
    ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class ResumeSource(str, enum.Enum):
    drive_link = "drive_link"
    uploaded_file = "uploaded_file"
    manual_text = "manual_text"

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
    current_job_title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    current_salary: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    
    preferred_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_job_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(50), default="required", nullable=True)
    notice_period: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    willing_to_relocate: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    has_resume: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resume_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_source: Mapped[ResumeSource] = mapped_column(
        SQLEnum(ResumeSource, name="resume_source"),
        default=ResumeSource.drive_link,
        nullable=False
    )
    resume_file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    resume_storage_bucket: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resume_storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resume_mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resume_file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    resume_uploaded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="website", nullable=False)
    consent_to_contact: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Backward compatibility property for current_role
    @property
    def current_role(self) -> Optional[str]:
        return self.current_job_title

    @current_role.setter
    def current_role(self, value: Optional[str]):
        self.current_job_title = value

    applications: Mapped[List["Application"]] = relationship("Application", back_populates="candidate")
    documents: Mapped[List["ApplicationDocument"]] = relationship("ApplicationDocument", back_populates="candidate")
    resumes: Mapped[List["CandidateResume"]] = relationship("CandidateResume", back_populates="candidate", cascade="all, delete-orphan")


class CandidateResume(Base):
    __tablename__ = "candidate_resumes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    source: Mapped[ResumeSource] = mapped_column(
        SQLEnum(ResumeSource, name="resume_source"),
        default=ResumeSource.uploaded_file,
        nullable=False
    )
    drive_link: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="resumes")
