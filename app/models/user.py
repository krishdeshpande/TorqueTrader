import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.models.base import Base


class UserRole(str, enum.Enum):
    buyer = "buyer"
    individual_seller = "individual_seller"
    dealer = "dealer"
    admin = "admin"


class UserStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"


class RidingExperience(str, enum.Enum):
    new = "new"
    experienced = "experienced"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Authentication identity — the email used for OTP login
    email = Column(String, unique=True, index=True, nullable=False)

    # Contact phone number (NOT used for authentication)
    phone_number = Column(String, unique=True, index=True, nullable=True)

    # Core profile fields
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)

    # Role & status
    role = Column(Enum(UserRole), default=UserRole.buyer, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.active, nullable=False)

    # Riding profile
    riding_experience = Column(Enum(RidingExperience), nullable=True)
    riding_duration_months = Column(Integer, nullable=True)

    # Bike data (stored as JSON arrays)
    current_bikes = Column(JSON, nullable=False, default=list)
    previous_bikes = Column(JSON, nullable=False, default=list)
    bike_preferences = Column(JSON, nullable=False, default=list)

    # Marketplace intent
    intent = Column(String(20), nullable=True)

    # Location & dream bike
    city = Column(String(200), nullable=True)
    dream_bike = Column(String(200), nullable=True)

    # Onboarding completion flag
    profile_completed = Column(Boolean, nullable=False, default=False, server_default="0")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
