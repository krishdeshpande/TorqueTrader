"""
TorqueTrader — Group Car & Insurance Buying Platform ORM Models.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    JSON,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class GroupType(str, enum.Enum):
    car_purchase = "car_purchase"
    insurance_renewal = "insurance_renewal"


class GroupStatus(str, enum.Enum):
    forming = "forming"
    target_reached = "target_reached"
    collecting_quotes = "collecting_quotes"
    quotes_received = "quotes_received"
    offers_available = "offers_available"
    decision_in_progress = "decision_in_progress"
    closed = "closed"
    cancelled = "cancelled"


class DealerVerificationStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class QuotationStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    revised = "revised"
    accepted = "accepted"
    expired = "expired"


class BuyerDecisionStatus(str, enum.Enum):
    interested = "interested"
    callback_requested = "callback_requested"
    booking_initiated = "booking_initiated"
    not_proceeding = "not_proceeding"


class VehicleCatalog(Base):
    __tablename__ = "vehicle_catalog"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, default="Car / SUV")
    make = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    variant = Column(String(150), nullable=False)
    fuel_type = Column(String(50), nullable=False)
    transmission = Column(String(50), nullable=False)
    approx_ex_showroom = Column(Float, nullable=False)
    approx_on_road = Column(Float, nullable=False)
    is_popular = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DealerOrganization(Base):
    __tablename__ = "dealer_organizations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    dealer_type = Column(String(50), nullable=False, default="car_dealership")  # car_dealership | insurance_broker
    name = Column(String(200), nullable=False, index=True)
    brands_authorized = Column(JSON, nullable=False, default=list)  # ["Hyundai"] or ["HDFC ERGO", "ICICI Lombard"]
    cities_covered = Column(JSON, nullable=False, default=list)     # ["Mumbai", "Thane", "Navi Mumbai"]
    contact_person = Column(String(120), nullable=False)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(30), nullable=False)
    gstin = Column(String(30), nullable=True)
    showroom_address = Column(String(300), nullable=True)
    verification_status = Column(String(30), default="pending", nullable=False)  # pending | verified | rejected
    verified_at = Column(DateTime(timezone=True), nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    quotations = relationship("DealerQuotation", back_populates="dealer", cascade="all, delete-orphan")


class BuyerGroup(Base):
    __tablename__ = "buyer_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_ref = Column(String(50), unique=True, index=True, nullable=False)
    group_type = Column(String(30), nullable=False, default="car_purchase")  # car_purchase | insurance_renewal
    title = Column(String(250), nullable=False)
    city = Column(String(100), nullable=False, index=True)

    # Vehicle targets (for car_purchase)
    target_make = Column(String(100), nullable=True, index=True)
    target_model = Column(String(100), nullable=True, index=True)
    target_variant = Column(String(150), nullable=True)
    fuel_type = Column(String(50), nullable=True)
    transmission = Column(String(50), nullable=True)

    # Insurance targets (for insurance_renewal or bundled pool)
    target_insurer = Column(String(100), nullable=True)  # Specific or "Multi-Insurer Bidding"
    default_addons = Column(JSON, nullable=False, default=list)  # ["Zero Depreciation", "Return to Invoice", etc.]

    # Capacity & Lifecycle
    target_members = Column(Integer, nullable=False, default=20)
    status = Column(String(40), nullable=False, default="forming", index=True)
    # forming -> target_reached -> collecting_quotes -> quotes_received -> offers_available -> decision_in_progress -> closed

    quote_deadline = Column(DateTime(timezone=True), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_demo = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    quotation_requests = relationship("QuotationRequest", back_populates="group", cascade="all, delete-orphan")
    quotations = relationship("DealerQuotation", back_populates="group", cascade="all, delete-orphan")


class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("buyer_groups.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    buyer_name = Column(String(120), nullable=False)
    buyer_email = Column(String(150), nullable=False)
    buyer_phone = Column(String(30), nullable=False)

    selected_color = Column(String(60), nullable=True)
    pool_group_insurance = Column(Boolean, default=True)  # Checkbox to join insurance group discount
    custom_addons = Column(JSON, nullable=False, default=list)  # Configurable per member
    purchase_timeline = Column(String(60), nullable=False, default="Within 30 Days")
    purchase_readiness = Column(String(40), nullable=False, default="ready_to_buy")  # ready_to_buy | researching
    current_ncb = Column(String(20), nullable=True)  # 50%, 35%, 20%, 0% for renewal

    status = Column(String(30), default="active", nullable=False)  # active | withdrawn | booked
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group = relationship("BuyerGroup", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("group_id", "buyer_email", name="uq_group_buyer_email"),
    )


class QuotationRequest(Base):
    __tablename__ = "quotation_requests"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("buyer_groups.id"), nullable=False, index=True)
    request_ref = Column(String(60), unique=True, index=True, nullable=False)
    status = Column(String(30), default="open", nullable=False)  # open | closed | awarded
    deadline = Column(DateTime(timezone=True), nullable=True)
    eligible_dealers_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("BuyerGroup", back_populates="quotation_requests")
    quotations = relationship("DealerQuotation", back_populates="request", cascade="all, delete-orphan")


class DealerQuotation(Base):
    __tablename__ = "dealer_quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_request_id = Column(Integer, ForeignKey("quotation_requests.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("buyer_groups.id"), nullable=False, index=True)
    dealer_id = Column(Integer, ForeignKey("dealer_organizations.id"), nullable=False, index=True)

    version = Column(Integer, default=1, nullable=False)

    # Price breakdown per vehicle (INR)
    ex_showroom_price = Column(Float, nullable=False)
    rto_road_tax = Column(Float, nullable=False)
    insurance_rate_standard = Column(Float, nullable=False)
    insurance_rate_group = Column(Float, nullable=False)
    mandatory_charges = Column(Float, default=0.0)
    standard_accessories = Column(Float, default=0.0)

    # Discounts
    group_cash_discount = Column(Float, default=0.0)
    corporate_exchange_bonus = Column(Float, default=0.0)

    # Net results
    final_net_on_road = Column(Float, nullable=False)
    total_group_discount = Column(Float, default=0.0)

    # Terms & Perks
    additional_perks = Column(JSON, nullable=False, default=list)  # ["Free 5-Yr Extended Warranty", "Fast Track Delivery"]
    validity_date = Column(String(100), nullable=True)
    delivery_timeline_weeks = Column(Integer, default=2)
    booking_amount = Column(Float, default=25000.0)
    conditions = Column(Text, nullable=True)

    status = Column(String(30), default="submitted", nullable=False)  # submitted | revised | accepted | expired
    is_sealed = Column(Boolean, default=True)  # True = other dealers cannot see amounts
    is_best_offer = Column(Boolean, default=False)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    group = relationship("BuyerGroup", back_populates="quotations")
    dealer = relationship("DealerOrganization", back_populates="quotations")
    request = relationship("QuotationRequest", back_populates="quotations")
    revisions = relationship("QuotationRevision", back_populates="quotation", cascade="all, delete-orphan")
    buyer_responses = relationship("BuyerOfferResponse", back_populates="quotation", cascade="all, delete-orphan")


class QuotationRevision(Base):
    __tablename__ = "quotation_revisions"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("dealer_quotations.id"), nullable=False)
    revision_number = Column(Integer, nullable=False)
    final_net_on_road = Column(Float, nullable=False)
    total_group_discount = Column(Float, nullable=False)
    change_summary = Column(String(300), nullable=True)
    revised_at = Column(DateTime(timezone=True), server_default=func.now())

    quotation = relationship("DealerQuotation", back_populates="revisions")


class BuyerOfferResponse(Base):
    __tablename__ = "buyer_offer_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("buyer_groups.id"), nullable=False)
    quotation_id = Column(Integer, ForeignKey("dealer_quotations.id"), nullable=False)

    buyer_name = Column(String(120), nullable=False)
    buyer_email = Column(String(150), nullable=False)
    buyer_phone = Column(String(30), nullable=False)

    decision = Column(String(40), nullable=False)  # interested | callback_requested | booking_initiated | not_proceeding
    preferred_contact_method = Column(String(30), default="phone")  # phone | whatsapp | email
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quotation = relationship("DealerQuotation", back_populates="buyer_responses")
