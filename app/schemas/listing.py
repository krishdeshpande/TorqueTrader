"""
TorqueTrader — Pydantic schemas for the Inventory module.

All request/response payloads for listing endpoints are validated and
serialised through these schemas.  Strict field constraints enforce
business rules at the API boundary so invalid data never reaches the
service layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.listing import BodyType, EngineConfig, ListingStatus


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ListingCreate(BaseModel):
    """Schema for creating a new superbike listing.

    Validation rules mirror database-level CHECK constraints so
    errors are caught early with user-friendly messages.
    """

    make: str = Field(
        ...,
        min_length=1,
        max_length=100,
        examples=["Ducati"],
        description="Manufacturer / brand name.",
    )
    model: str = Field(
        ...,
        min_length=1,
        max_length=150,
        examples=["Panigale V4"],
        description="Model designation.",
    )
    year: int = Field(
        ...,
        ge=1990,
        le=datetime.now().year + 1,
        examples=[2023],
        description="Model year (must be ≥ 1990).",
    )
    price: float = Field(
        ...,
        gt=0,
        examples=[2500000.00],
        description="Asking price in the seller's local currency.",
    )
    odometer: int = Field(
        ...,
        ge=0,
        examples=[8500],
        description="Odometer reading in kilometres.",
    )
    engine_config: EngineConfig = Field(
        ...,
        examples=[EngineConfig.V_TWIN],
        description="Engine cylinder configuration.",
    )
    body_type: BodyType = Field(
        ...,
        examples=[BodyType.SUPERSPORT],
        description="Primary body style.",
    )
    bhp: float = Field(
        ...,
        gt=0,
        examples=[215.5],
        description="Brake horsepower.",
    )
    location: str = Field(
        ...,
        min_length=1,
        max_length=200,
        examples=["Mumbai, Maharashtra"],
        description="Seller's city / region.",
    )


class ListingStatusUpdate(BaseModel):
    """Admin-only payload for transitioning a listing's lifecycle state.

    ``score_bump`` lets an admin reward listings that pass document
    verification.  The service layer caps the total at 100.
    """

    status: ListingStatus = Field(
        ...,
        description="Target lifecycle status.",
    )
    score_bump: Optional[int] = Field(
        default=0,
        ge=0,
        le=100,
        description=(
            "Points to add to the listing's transparency score "
            "(clamped to a maximum total of 100)."
        ),
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ListingResponse(ListingCreate):
    """Full listing representation returned to API consumers.

    Inherits every field from ``ListingCreate`` and augments it with
    server-managed metadata.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    status: ListingStatus
    transparency_score: int
    created_at: datetime
    updated_at: datetime
