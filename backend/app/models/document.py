import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, BigInteger, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    candidate_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=True, index=True)
    document_type: Mapped[str] = mapped_column(String(50), default="resume", nullable=False) # resume, passport, certificate, photo, other
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_bucket: Mapped[str] = mapped_column(String(100), default="candidate-resumes", nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    file_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True) # Optional direct PostgreSQL BYTEA binary storage
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    application: Mapped[Optional["Application"]] = relationship("Application", back_populates="documents")
    candidate: Mapped[Optional["Candidate"]] = relationship("Candidate", back_populates="documents")
