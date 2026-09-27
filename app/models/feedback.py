from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.models.base import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    category = Column(String(64), nullable=False, default="General Feedback")
    rating = Column(Integer, nullable=True, default=5)
    message = Column(Text, nullable=False)
    page_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
