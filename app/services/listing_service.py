"""
TorqueTrader — Service layer for the Inventory & Enthusiast Search modules.

All database mutations and complex queries are encapsulated here, keeping
the router layer thin and focused on HTTP concerns.  Functions receive a
SQLAlchemy ``Session`` and return ORM instances — they never touch request
or response objects directly.

Security notes
--------------
* All queries use parameterised SQLAlchemy expressions — there is **no**
  string interpolation of user input, eliminating SQL-injection vectors.
* ``create_listing`` force-sets ``status = DRAFT`` regardless of input,
  preventing sellers from self-activating listings.
* ``update_listing_status`` clamps ``transparency_score`` to [0, 100].
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.listing import EngineConfig, Listing, ListingStatus


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def create_listing(
    db: Session,
    listing_data: dict,
    seller_id: int,
) -> Listing:
    """Persist a new listing in DRAFT status.

    Parameters
    ----------
    db:
        Active database session (provided by the ``get_db`` dependency).
    listing_data:
        Dictionary of validated listing fields (typically from
        ``ListingCreate.model_dump()``).
    seller_id:
        ID of the authenticated seller creating the listing.

    Returns
    -------
    Listing
        The fully-hydrated ORM object after commit (includes ``id``,
        ``created_at``, etc.).

    Notes
    -----
    The ``status`` key is **always** overwritten to ``DRAFT`` even if
    the caller supplies a different value — this is a deliberate
    security measure to prevent privilege escalation.
    """
    # Prevent callers from injecting a non-DRAFT status.
    listing_data.pop("status", None)

    listing = Listing(
        **listing_data,
        seller_id=seller_id,
        status=ListingStatus.DRAFT,
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


# ---------------------------------------------------------------------------
# READ — Enthusiast Search Engine
# ---------------------------------------------------------------------------

def get_listings(
    db: Session,
    *,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    engine_config: Optional[EngineConfig] = None,
    min_bhp: Optional[float] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Sequence[Listing]:
    """Return active listings that match the given search filters.

    Only listings with ``status == ACTIVE`` are ever surfaced.  All
    filters are optional and are applied **dynamically** — omitted
    filters simply have no effect.

    Parameters
    ----------
    db:
        Active database session.
    min_price / max_price:
        Inclusive price band (in seller currency).
    engine_config:
        Filter by engine cylinder layout.
    min_bhp:
        Minimum brake horsepower.
    location:
        Case-insensitive substring match (uses ``ILIKE``).
    skip / limit:
        Pagination controls.

    Returns
    -------
    Sequence[Listing]
        Ordered by ``transparency_score`` DESC then ``created_at`` DESC
        so the most trusted and newest listings appear first.
    """
    stmt = select(Listing).where(Listing.status == ListingStatus.ACTIVE)

    # Dynamic filters — each guard clause appends a WHERE predicate.
    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)

    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)

    if engine_config is not None:
        stmt = stmt.where(Listing.engine_config == engine_config)

    if min_bhp is not None:
        stmt = stmt.where(Listing.bhp >= min_bhp)

    if location is not None:
        # ILIKE is PostgreSQL-specific; for other dialects swap to
        # func.lower() + like() if portability is required.
        stmt = stmt.where(Listing.location.ilike(f"%{location}%"))

    # Sort: best transparency first, then newest.
    stmt = stmt.order_by(
        Listing.transparency_score.desc(),
        Listing.created_at.desc(),
    )

    # Pagination
    stmt = stmt.offset(skip).limit(limit)

    return db.scalars(stmt).all()


# ---------------------------------------------------------------------------
# UPDATE — Admin status transitions
# ---------------------------------------------------------------------------

def update_listing_status(
    db: Session,
    listing_id: int,
    new_status: ListingStatus,
    score_bump: int = 0,
) -> Optional[Listing]:
    """Transition a listing to a new lifecycle status.

    Parameters
    ----------
    db:
        Active database session.
    listing_id:
        PK of the listing to update.
    new_status:
        Target ``ListingStatus`` value.
    score_bump:
        Positive integer to add to ``transparency_score``.
        The final score is clamped to a maximum of **100**.

    Returns
    -------
    Listing | None
        The updated ORM object, or ``None`` if no listing matched
        ``listing_id`` (caller should raise a 404).
    """
    listing: Optional[Listing] = db.get(Listing, listing_id)

    if listing is None:
        return None

    listing.status = new_status

    if score_bump and score_bump > 0:
        listing.transparency_score = min(
            listing.transparency_score + score_bump,
            100,
        )

    listing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(listing)
    return listing
