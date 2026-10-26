"""
TorqueTrader — Pydantic Schemas for Group Car & Insurance Buying.
"""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class CatalogItemSchema(BaseModel):
    id: int
    category: str
    make: str
    model: str
    variant: str
    fuel_type: str
    transmission: str
    approx_ex_showroom: float
    approx_on_road: float
    is_popular: bool = True
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GroupCreateRequest(BaseModel):
    group_type: str = Field(default="car_purchase")  # "car_purchase" or "insurance_renewal"
    title: str = Field(..., min_length=5, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    target_make: Optional[str] = None
    target_model: Optional[str] = None
    target_variant: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    target_insurer: Optional[str] = "Multi-Insurer Bidding"
    target_members: int = Field(default=20, ge=2, le=100)
    default_addons: List[str] = Field(default_factory=lambda: [
        "Zero Depreciation",
        "Return to Invoice",
        "Engine & Gearbox Protection",
        "Consumables Cover",
    ])
    target_purchase_timeline: str = Field(default="Within 30 Days")
    notes: Optional[str] = None


class GroupJoinRequest(BaseModel):
    buyer_name: str = Field(..., min_length=2)
    buyer_email: EmailStr
    buyer_phone: str = Field(..., min_length=10)
    selected_color: Optional[str] = None
    pool_group_insurance: bool = True
    custom_addons: List[str] = Field(default_factory=list)
    purchase_timeline: str = Field(default="Within 30 Days")
    purchase_readiness: str = Field(default="ready_to_buy")
    current_ncb: Optional[str] = "0%"


class GroupMemberSummary(BaseModel):
    id: int
    buyer_name: str
    pool_group_insurance: bool
    custom_addons: List[str]
    purchase_timeline: str
    purchase_readiness: str
    joined_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class DealerQuotationSchema(BaseModel):
    id: int
    dealer_name: str
    dealer_type: str
    dealer_id: int
    version: int
    ex_showroom_price: float
    rto_road_tax: float
    insurance_rate_standard: float
    insurance_rate_group: float
    mandatory_charges: float
    standard_accessories: float
    group_cash_discount: float
    corporate_exchange_bonus: float
    final_net_on_road: float
    total_group_discount: float
    additional_perks: List[str]
    validity_date: Optional[str]
    delivery_timeline_weeks: int
    booking_amount: float
    conditions: Optional[str]
    is_best_offer: bool
    submitted_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class GroupSummarySchema(BaseModel):
    id: int
    group_ref: str
    group_type: str
    title: str
    city: str
    target_make: Optional[str]
    target_model: Optional[str]
    target_variant: Optional[str]
    fuel_type: Optional[str]
    transmission: Optional[str]
    target_insurer: Optional[str]
    target_members: int
    member_count: int
    insurance_pooled_count: int
    status: str
    quote_deadline: Optional[datetime]
    created_at: Optional[datetime]
    best_quote_on_road: Optional[float] = None
    max_savings_per_car: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class GroupDetailSchema(GroupSummarySchema):
    default_addons: List[str]
    notes: Optional[str]
    members: List[GroupMemberSummary] = []
    quotations: List[DealerQuotationSchema] = []
    is_user_member: bool = False


class DealerRegisterRequest(BaseModel):
    dealer_type: str = Field(default="car_dealership")  # car_dealership | insurance_broker
    name: str = Field(..., min_length=3)
    brands_authorized: List[str] = Field(..., min_length=1)
    cities_covered: List[str] = Field(..., min_length=1)
    contact_person: str = Field(..., min_length=2)
    email: EmailStr
    phone: str = Field(..., min_length=10)
    gstin: Optional[str] = None
    showroom_address: Optional[str] = None


class DealerQuoteSubmitRequest(BaseModel):
    group_id: int
    ex_showroom_price: float = Field(..., ge=0)
    rto_road_tax: float = Field(..., ge=0)
    insurance_rate_standard: float = Field(..., ge=0)
    insurance_rate_group: float = Field(..., ge=0)
    mandatory_charges: float = Field(default=0.0, ge=0)
    standard_accessories: float = Field(default=0.0, ge=0)
    group_cash_discount: float = Field(default=0.0, ge=0)
    corporate_exchange_bonus: float = Field(default=0.0, ge=0)
    additional_perks: List[str] = Field(default_factory=list)
    validity_date: Optional[str] = "Valid for 15 Days"
    delivery_timeline_weeks: int = Field(default=2, ge=1)
    booking_amount: float = Field(default=25000.0, ge=0)
    conditions: Optional[str] = None


class BuyerOfferDecisionRequest(BaseModel):
    group_id: int
    quotation_id: int
    buyer_name: str
    buyer_email: EmailStr
    buyer_phone: str
    decision: str = Field(default="callback_requested")  # interested | callback_requested | booking_initiated | not_proceeding
    preferred_contact_method: str = Field(default="phone")  # phone | whatsapp | email
    notes: Optional[str] = None


class AdminMetricsResponse(BaseModel):
    total_active_groups: int
    total_ready_buyers: int
    total_dealers_registered: int
    total_verified_dealers: int
    total_quotes_submitted: int
    average_group_discount_inr: float
    total_estimated_community_savings_inr: float
