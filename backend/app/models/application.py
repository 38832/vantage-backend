import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.db.base import Base

class ApplicationStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    shortlisted = "shortlisted"
    interview_scheduled = "interview_scheduled"
    interviewed = "interviewed"
    document_pending = "document_pending"
    medical_pending = "medical_pending"
    visa_pending = "visa_pending"
    visa_approved = "visa_approved"
    rejected = "rejected"
    hired = "hired"
    archived = "archived"

class Application(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    source_channel: Mapped[str] = mapped_column(String(50), default="job_portal", nullable=False)
    
    application_status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.new,
        nullable=False,
        index=True
    )
    
    recruiter_assigned: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    shortlisted_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    interview_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    interview_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    document_status: Mapped[Optional[str]] = mapped_column(String(50), default="pending", nullable=True)
    medical_status: Mapped[Optional[str]] = mapped_column(String(50), default="pending", nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(50), default="not_started", nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="applications")
    job: Mapped[Optional["Job"]] = relationship("Job", back_populates="applications")
    documents: Mapped[List["ApplicationDocument"]] = relationship("ApplicationDocument", back_populates="application")
    ats_notes: Mapped[List["ATSNote"]] = relationship("ATSNote", back_populates="application", cascade="all, delete-orphan")
