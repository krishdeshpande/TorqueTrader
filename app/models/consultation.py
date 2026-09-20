from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.models.base import Base


class ConsultationBooking(Base):
    __tablename__ = "consultation_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(64), unique=True, index=True, nullable=False)
    client_name = Column(String(128), nullable=False)
    client_email = Column(String(255), nullable=False)
    client_phone = Column(String(32), nullable=False)
    tier_id = Column(String(64), nullable=False)
    tier_title = Column(String(128), nullable=False)
    tier_price = Column(Integer, nullable=False)
    budget_range = Column(String(64), nullable=True)
    target_vehicle = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="pending", nullable=False)  # pending | contacted | completed
    payment_status = Column(String(32), default="pending", nullable=False)  # pending | paid
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
