import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Employer(Base):
    __tablename__ = "employers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    company_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    inquiries: Mapped[List["EmployerInquiry"]] = relationship("EmployerInquiry", back_populates="employer")
