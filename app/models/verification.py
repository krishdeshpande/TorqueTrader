"""
TorqueTrader — SQLAlchemy ORM model for the Verification Audit Log.

Table
-----
* **verification_logs** – Audit trail of documents uploaded for
  admin verification of a listing (RC book, service history, etc.).

Each row maps to an object stored in S3 (or compatible store).
The ``s3_reference_id`` column carries a UNIQUE constraint to
guarantee referential integrity between the DB and the object store.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.listing import Listing


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
