"""
TorqueTrader — Pydantic schemas for the Inventory & Superbike Spec module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.listing import BodyType, EngineConfig, ListingStatus


# ---------------------------------------------------------------------------
# mParivahan / RC Lookup Schemas
# ---------------------------------------------------------------------------

class RCLookupResponse(BaseModel):
    """Normalized RC and vehicle specifications from mParivahan lookup."""
    reg_number: str
    is_verified_vahan: bool = True
    rto_location: str
    state_code: str
    registration_date: str
    year: int
    ownership_serial: int
    ownership_label: str
    fitness_valid_until: str
    insurance_type: str
    insurance_valid_until: str
    hypothecation_status: str
    puc_valid: bool = True
    make: str
    model: str
    engine_config: str
    body_type: str
    displacement_cc: int
    bhp: float
    torque_nm: float
    transmission: str
    fuel_type: str = "Petrol"
    suggested_price_min: int
    suggested_price_max: int


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ListingCreate(BaseModel):
    """Schema for creating a new superbike listing."""

    make: str = Field(..., min_length=1, max_length=100, examples=["Ducati"])
    model: str = Field(..., min_length=1, max_length=150, examples=["Panigale V4 S"])
    year: int = Field(..., ge=1990, le=datetime.now().year + 1, examples=[2023])
    price: float = Field(..., gt=0, examples=[2850000.00])
    odometer: int = Field(..., ge=0, examples=[5200])
    engine_config: EngineConfig = Field(..., examples=[EngineConfig.V_TWIN])
    body_type: BodyType = Field(..., examples=[BodyType.SUPERSPORT])
    bhp: float = Field(..., gt=0, examples=[215.5])
    location: str = Field(..., min_length=1, max_length=200, examples=["Mumbai, Maharashtra"])

    # Extended enthusiast parameters
    reg_number: Optional[str] = Field(None, max_length=20, examples=["MH02DW1234"])
    rto_state: Optional[str] = Field(None, max_length=100, examples=["Maharashtra (MH02)"])
    ownership_count: Optional[int] = Field(1, ge=1, le=10)
    displacement_cc: Optional[int] = Field(None, ge=100, le=3000)
    torque_nm: Optional[float] = Field(None, ge=10)
    transmission: Optional[str] = Field(None, max_length=100)
    seat_height_mm: Optional[int] = Field(None)
    weight_kg: Optional[int] = Field(None)
    exhaust_type: Optional[str] = Field(None, examples=["Full System Akrapovič Titanium"])
    tyre_condition_pct: Optional[int] = Field(85, ge=0, le=100)
    tyre_dot_year: Optional[int] = Field(2023)
    chain_sprocket_health: Optional[str] = Field("Excellent (Recent Clean & Lube)")
    keys_count: Optional[int] = Field(2, ge=1, le=5)
    service_history_type: Optional[str] = Field("Authorized Dealership Records Available")
    insurance_type: Optional[str] = Field("Comprehensive (Zero Depreciation)")
    insurance_valid_until: Optional[str] = Field(None)
    hypothecation_status: Optional[str] = Field("No Hypothecation (Clean NOC)")
    modifications: Optional[List[str]] = Field(default_factory=list)
    flaws: Optional[List[str]] = Field(default_factory=list)
    equipment: Optional[List[str]] = Field(default_factory=list)
    editorial_review: Optional[str] = Field(None)
    media_gallery: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    description: Optional[str] = Field(None)


class ListingStatusUpdate(BaseModel):
    """Admin payload for updating listing status."""
    status: ListingStatus
    score_bump: Optional[int] = Field(default=0, ge=0, le=100)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ListingResponse(ListingCreate):
    """Full listing representation returned to API consumers."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    status: ListingStatus
    transparency_score: int
    created_at: datetime
    updated_at: datetime
