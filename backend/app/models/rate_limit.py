from sqlalchemy import BigInteger, Column, Integer, String
from app.db.base import Base


class RateLimitBucket(Base):
    """Shared rate-limit counter bucket for multi-worker enforcement."""

    __tablename__ = "rate_limit_buckets"

    key = Column(String(128), primary_key=True)
    window_start = Column(BigInteger, nullable=False, index=True)
    count = Column(Integer, nullable=False, default=0)
