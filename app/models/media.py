import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base

class BucketType(str, enum.Enum):
    public = "public"
    private = "private"

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, nullable=True) # Might be uploaded during registration (no listing yet)
    file_name = Column(String, nullable=False)
    s3_key = Column(String, nullable=False)
    bucket_type = Column(Enum(BucketType), nullable=False)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
