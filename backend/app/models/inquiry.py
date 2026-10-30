import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class EmployerInquiry(Base):
    __tablename__ = "employer_inquiries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("employers.id", ondelete="SET NULL"), nullable=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    
    requirement_type: Mapped[str] = mapped_column(String(50), default="manpower", nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    number_of_positions: Mapped[Optional[int]] = mapped_column(Integer, default=1, nullable=True)
    
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_location: Mapped[Optional[str]] = mapped_column(String(100), default="overseas", nullable=True)
    budget_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    urgency: Mapped[str] = mapped_column(String(50), default="normal", nullable=False)
    timeline: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="website", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employer: Mapped[Optional["Employer"]] = relationship("Employer", back_populates="inquiries")
