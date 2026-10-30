import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_type: Mapped[str] = mapped_column(String(50), nullable=False) # recruitment, documentation, visa, mobilization
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="website", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
