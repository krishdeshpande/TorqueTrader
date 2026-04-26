"""
TorqueTrader — FastAPI router for the Inventory & Enthusiast Search endpoints.

Endpoints
---------
* ``POST   /listings/``                  — Create a new listing (seller).
* ``GET    /listings/``                  — Public search with dynamic filters.
* ``PATCH  /listings/{listing_id}/status`` — Admin-only status transition.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.listing import EngineConfig, ListingStatus
from app.schemas.listing import ListingCreate, ListingResponse, ListingStatusUpdate
from app.services import listing_service

# ---------------------------------------------------------------------------
# Auth dependencies (implemented by the Auth team in app.core.security).
# get_current_user returns a User ORM object (has .id attribute).
# require_admin is a RoleChecker([UserRole.ADMIN]) instance.
# ---------------------------------------------------------------------------
from app.core.security import get_current_user, require_admin  # noqa: E402

router = APIRouter(prefix="/listings", tags=["Inventory"])


# ---------------------------------------------------------------------------
# POST /listings/ — Create listing
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new superbike listing",
    description=(
        "Authenticated sellers submit a new listing which enters the "
        "pipeline in **DRAFT** status regardless of the payload.  "
        "The listing must be verified by an admin before it becomes "
        "publicly visible."
    ),
)
def create_listing(
    payload: ListingCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ListingResponse:
    """Create a new listing owned by the authenticated seller."""
    listing = listing_service.create_listing(
        db=db,
        listing_data=payload.model_dump(),
        seller_id=current_user.id,
    )
    return listing


# ---------------------------------------------------------------------------
# GET /listings/ — Enthusiast Search Engine
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=List[ListingResponse],
    summary="Search active superbike listings",
    description=(
        "Publicly accessible endpoint that surfaces only **ACTIVE** "
        "listings.  All filter parameters are optional — omit them to "
        "browse the full catalogue.  Results are ranked by "
        "transparency score (desc) then recency (desc)."
    ),
)
def search_listings(
    min_price: Optional[float] = Query(
        default=None, ge=0, description="Minimum price (inclusive)."
    ),
    max_price: Optional[float] = Query(
        default=None, ge=0, description="Maximum price (inclusive)."
    ),
    engine_config: Optional[EngineConfig] = Query(
        default=None, description="Filter by engine configuration."
    ),
    min_bhp: Optional[float] = Query(
        default=None, ge=0, description="Minimum brake horsepower."
    ),
    location: Optional[str] = Query(
        default=None,
        max_length=200,
        description="Case-insensitive location substring search.",
    ),
    skip: int = Query(
        default=0, ge=0, description="Number of results to skip (pagination)."
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum results to return (1–100).",
    ),
    db: Session = Depends(get_db),
) -> List[ListingResponse]:
    """Execute a filtered, paginated search over active listings."""
    return listing_service.get_listings(
        db=db,
        min_price=min_price,
        max_price=max_price,
        engine_config=engine_config,
        min_bhp=min_bhp,
        location=location,
        skip=skip,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# PATCH /listings/{listing_id}/status — Admin status transition
# ---------------------------------------------------------------------------

@router.patch(
    "/{listing_id}/status",
    response_model=ListingResponse,
    summary="Update listing status (admin only)",
    description=(
        "Allows admins to transition a listing through its lifecycle "
        "(e.g. DRAFT → ACTIVE, or PENDING_VERIFICATION → REJECTED) and "
        "optionally boost its transparency score."
    ),
)
def update_listing_status(
    listing_id: int,
    payload: ListingStatusUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
) -> ListingResponse:
    """Transition a listing's status and optionally bump its score."""
    listing = listing_service.update_listing_status(
        db=db,
        listing_id=listing_id,
        new_status=payload.status,
        score_bump=payload.score_bump or 0,
    )

    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id={listing_id} not found.",
        )

    return listing
