import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base

class InteractionType(str, enum.Enum):
    phone_reveal = "phone_reveal"
    whatsapp_click = "whatsapp_click"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, nullable=False) # In a real app, this would be ForeignKey("listings.id")
    interaction_type = Column(Enum(InteractionType), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
