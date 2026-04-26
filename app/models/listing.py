"""
TorqueTrader — SQLAlchemy ORM models for the Inventory module.

Tables
------
* **listings**  – Core bike listing posted by a seller.
* **verification_logs** – Audit trail of documents uploaded for
  admin verification of a listing (RC book, service history, etc.).

All enums are stored as native PostgreSQL enum types for type-safety at
the database level.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import List

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


# ---------------------------------------------------------------------------
# Domain enums
# ---------------------------------------------------------------------------

class ListingStatus(str, enum.Enum):
    """Lifecycle state of a listing."""

    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SOLD = "sold"
    REJECTED = "rejected"


class EngineConfig(str, enum.Enum):
    """Engine layout / cylinder configuration."""

    INLINE_4 = "Inline-4"
    V_TWIN = "V-Twin"
    L_TWIN = "L-Twin"
    TRIPLE = "Triple"
    BOXER = "Boxer"
    OTHER = "Other"


class BodyType(str, enum.Enum):
    """Primary body style of the motorcycle."""

    SUPERSPORT = "Supersport"
    NAKED = "Naked"
    ADV = "ADV"
    CRUISER = "Cruiser"
    MODERN_CLASSIC = "Modern Classic"


# ---------------------------------------------------------------------------
# Listing table
# ---------------------------------------------------------------------------

class Listing(Base):
    """A superbike listing created by a seller.

    Indexes are placed on columns frequently used for filtering and
    sorting in the Enthusiast Search Engine.
    """

    __tablename__ = "listings"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to the users table (managed by Auth team).
    # CASCADE ensures listings are removed when the seller account is deleted.
    seller_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Bike metadata
    make: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    odometer: Mapped[int] = mapped_column(Integer, nullable=False)

    engine_config: Mapped[EngineConfig] = mapped_column(
        Enum(EngineConfig, name="engine_config_enum", native_enum=True),
        nullable=False,
    )
    body_type: Mapped[BodyType] = mapped_column(
        Enum(BodyType, name="body_type_enum", native_enum=True),
        nullable=False,
    )

    bhp: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False, index=True)

    # Lifecycle & trust
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status_enum", native_enum=True),
        nullable=False,
        default=ListingStatus.DRAFT,
        server_default=ListingStatus.DRAFT.value,
        index=True,
    )
    transparency_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Timestamps (UTC)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    verification_logs: Mapped[List["VerificationLog"]] = relationship(
        "VerificationLog",
        back_populates="listing",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )

    # Table-level constraints
    __table_args__ = (
        CheckConstraint("transparency_score >= 0 AND transparency_score <= 100",
                        name="ck_listings_transparency_score_range"),
        CheckConstraint("price > 0", name="ck_listings_price_positive"),
        CheckConstraint("odometer >= 0", name="ck_listings_odometer_non_negative"),
        CheckConstraint("bhp > 0", name="ck_listings_bhp_positive"),
        CheckConstraint("year >= 1990", name="ck_listings_year_min"),
        # Composite index for the primary search sort order
        Index(
            "ix_listings_active_score_created",
            "status",
            "transparency_score",
            "created_at",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Listing id={self.id} make={self.make!r} model={self.model!r} "
            f"year={self.year} status={self.status.value!r}>"
        )


# ---------------------------------------------------------------------------
# Verification log table
# ---------------------------------------------------------------------------

class VerificationLog(Base):
    """Audit record of a document submitted for listing verification.

    Each row maps to an object stored in S3 (or compatible store).
    The ``s3_reference_id`` column carries a UNIQUE constraint to
    guarantee referential integrity between the DB and the object store.
    """

    __tablename__ = "verification_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="E.g. 'RC', 'SERVICE', 'INSURANCE', 'PUC'",
    )

    s3_reference_id: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        unique=True,
    )

    admin_notes: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # Relationship back to the parent listing
    listing: Mapped["Listing"] = relationship(
        "Listing",
        back_populates="verification_logs",
    )

    def __repr__(self) -> str:
        return (
            f"<VerificationLog id={self.id} listing_id={self.listing_id} "
            f"type={self.document_type!r}>"
        )
