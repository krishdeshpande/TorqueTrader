"""
TorqueTrader — FastAPI router for the Inventory, Enthusiast Search & mParivahan RC lookup endpoints.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.listing import EngineConfig, ListingStatus
from app.schemas.listing import ListingCreate, ListingResponse, ListingStatusUpdate, RCLookupResponse
from app.services import listing_service
from app.services.mparivahan import lookup_rc_details, clean_reg_number
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/listings", tags=["Inventory"])


# ---------------------------------------------------------------------------
# GET /listings/rc-lookup/{reg_no} — mParivahan RC Autofill
# ---------------------------------------------------------------------------

@router.get(
    "/rc-lookup/{reg_no}",
    response_model=RCLookupResponse,
    summary="mParivahan / VAHAN RC verification & bike spec autofill",
    description=(
        "Decodes an Indian motorcycle registration plate (e.g. MH02DW1234, DL03CY5678, KA05KJ9999) "
        "and returns verified RTO metadata, insurance validity, ownership count, and technical specifications."
    ),
)
def rc_lookup(reg_no: str) -> RCLookupResponse:
    """Fetch verified RC metadata and superbike specs from plate number."""
    try:
        data = lookup_rc_details(reg_no)
        return RCLookupResponse(**data)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


# ---------------------------------------------------------------------------
# POST /listings/ — Create listing
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new superbike listing",
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
)
def search_listings(
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    engine_config: Optional[EngineConfig] = Query(default=None),
    min_bhp: Optional[float] = Query(default=None, ge=0),
    location: Optional[str] = Query(default=None, max_length=200),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
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
