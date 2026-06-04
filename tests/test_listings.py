"""
TorqueTrader — Comprehensive test suite for the Listings module.

Tests cover:
  1. Listing creation (valid & invalid inputs)
  2. Public search filtering (price, engine, BHP, location)
  3. Public visibility (only ACTIVE listings returned)
  4. Search result ordering (transparency_score DESC, created_at DESC)
  5. Admin status transitions & transparency score capping
  6. Role-based access control (admin-only routes)
  7. Pagination
  8. VerificationLog model integrity
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.listing import Listing, ListingStatus, EngineConfig, BodyType
from app.models.verification import VerificationLog
from app.database import get_db
from app.core.security import create_access_token, get_current_user
from app.main import app


# ---------------------------------------------------------------------------
# Test database (in-memory SQLite)
# ---------------------------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, tear down after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Yield a clean DB session and rollback after use."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _make_seller(db) -> User:
    """Insert a seller user and return it."""
    user = User(
        phone_number="+919999999999",
        role=UserRole.individual_seller,
        status=UserStatus.active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_admin(db) -> User:
    """Insert an admin user and return it."""
    user = User(
        phone_number="+910000000000",
        role=UserRole.admin,
        status=UserStatus.active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_buyer(db) -> User:
    """Insert a buyer user and return it."""
    user = User(
        phone_number="+911111111111",
        role=UserRole.buyer,
        status=UserStatus.active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _token_for(user: User) -> str:
    """Generate a valid JWT for the given user."""
    return create_access_token(data={"sub": user.phone_number, "role": user.role.value})


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# Override the DB dependency globally for all test client calls.
app.dependency_overrides[get_db] = _override_get_db


VALID_LISTING_PAYLOAD = {
    "make": "Ducati",
    "model": "Panigale V4",
    "year": 2023,
    "price": 2500000.00,
    "odometer": 8500,
    "engine_config": "V-Twin",
    "body_type": "Supersport",
    "bhp": 215.5,
    "location": "Mumbai, Maharashtra",
}

client = TestClient(app)


# ===================================================================
# 1. Listing Creation
# ===================================================================

class TestCreateListing:
    """POST /listings/ — valid & invalid creation scenarios."""

    def test_create_listing_success(self, db):
        seller = _make_seller(db)
        resp = client.post(
            "/listings/",
            json=VALID_LISTING_PAYLOAD,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["make"] == "Ducati"
        assert data["model"] == "Panigale V4"
        assert data["status"] == ListingStatus.DRAFT.value
        assert data["transparency_score"] == 0
        assert data["seller_id"] == seller.id

    def test_create_listing_forces_draft(self, db):
        """Even if the caller tries to set status=ACTIVE it is ignored."""
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "status": "active"}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 201
        assert resp.json()["status"] == ListingStatus.DRAFT.value

    def test_create_listing_negative_price_rejected(self, db):
        """Pydantic schema must reject price <= 0."""
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "price": -100}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 422  # Validation error

    def test_create_listing_zero_price_rejected(self, db):
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "price": 0}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 422

    def test_create_listing_invalid_year_rejected(self, db):
        """Year < 1990 must be rejected."""
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "year": 1985}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 422

    def test_create_listing_negative_bhp_rejected(self, db):
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "bhp": -10}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 422

    def test_create_listing_negative_odometer_rejected(self, db):
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "odometer": -1}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 422

    def test_create_listing_empty_make_rejected(self, db):
        seller = _make_seller(db)
        payload = {**VALID_LISTING_PAYLOAD, "make": ""}
        resp = client.post(
            "/listings/",
            json=payload,
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 422

    def test_create_listing_unauthenticated(self):
        """No token → 401."""
        resp = client.post("/listings/", json=VALID_LISTING_PAYLOAD)
        assert resp.status_code == 401


# ===================================================================
# 2. Public Search — Filtering
# ===================================================================

def _seed_active_listings(db) -> list[int]:
    """Create several ACTIVE listings with varying attributes.
    Returns their IDs in insertion order.
    """
    seller = _make_seller(db)
    bikes = [
        # (make, model, year, price, odo, engine, body, bhp, location, score)
        ("Ducati", "Panigale V4", 2023, 2500000, 5000, EngineConfig.V_TWIN, BodyType.SUPERSPORT, 215.5, "Mumbai, Maharashtra", 90),
        ("Kawasaki", "ZX-10R", 2022, 1800000, 12000, EngineConfig.INLINE_4, BodyType.SUPERSPORT, 200.0, "Bangalore, Karnataka", 70),
        ("BMW", "R 1250 GS", 2023, 2100000, 3000, EngineConfig.BOXER, BodyType.ADV, 136.0, "Delhi, NCR", 85),
        ("Triumph", "Speed Triple", 2021, 1600000, 20000, EngineConfig.TRIPLE, BodyType.NAKED, 178.0, "Mumbai, Maharashtra", 60),
        ("Harley-Davidson", "Fat Boy", 2020, 2200000, 8000, EngineConfig.V_TWIN, BodyType.CRUISER, 93.0, "Chennai, Tamil Nadu", 50),
    ]
    ids = []
    for make, model, year, price, odo, eng, body, bhp, loc, score in bikes:
        listing = Listing(
            seller_id=seller.id, make=make, model=model, year=year,
            price=price, odometer=odo, engine_config=eng, body_type=body,
            bhp=bhp, location=loc, status=ListingStatus.ACTIVE,
            transparency_score=score,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)
        ids.append(listing.id)
    return ids


class TestSearchListings:
    """GET /listings/ — filter, sort, paginate."""

    def test_search_returns_only_active(self, db):
        """DRAFT/PENDING/SOLD/REJECTED listings must not appear."""
        seller = _make_seller(db)
        # Active listing
        active = Listing(
            seller_id=seller.id, make="Ducati", model="V4", year=2023,
            price=2000000, odometer=5000, engine_config=EngineConfig.V_TWIN,
            body_type=BodyType.SUPERSPORT, bhp=200, location="Mumbai",
            status=ListingStatus.ACTIVE, transparency_score=80,
        )
        # Draft listing
        draft = Listing(
            seller_id=seller.id, make="Honda", model="CBR", year=2022,
            price=900000, odometer=10000, engine_config=EngineConfig.INLINE_4,
            body_type=BodyType.SUPERSPORT, bhp=180, location="Delhi",
            status=ListingStatus.DRAFT, transparency_score=50,
        )
        # Sold listing
        sold = Listing(
            seller_id=seller.id, make="Yamaha", model="R1", year=2021,
            price=1500000, odometer=15000, engine_config=EngineConfig.INLINE_4,
            body_type=BodyType.SUPERSPORT, bhp=195, location="Pune",
            status=ListingStatus.SOLD, transparency_score=90,
        )
        db.add_all([active, draft, sold])
        db.commit()

        resp = client.get("/listings/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["make"] == "Ducati"

    def test_filter_by_price_range(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/", params={"min_price": 2000000, "max_price": 2200000})
        data = resp.json()
        assert all(2000000 <= d["price"] <= 2200000 for d in data)

    def test_filter_by_engine_config(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/", params={"engine_config": "V-Twin"})
        data = resp.json()
        assert all(d["engine_config"] == "V-Twin" for d in data)
        assert len(data) == 2  # Ducati Panigale + Harley Fat Boy

    def test_filter_by_min_bhp(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/", params={"min_bhp": 180})
        data = resp.json()
        assert all(d["bhp"] >= 180 for d in data)

    def test_filter_by_location(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/", params={"location": "Mumbai"})
        data = resp.json()
        assert len(data) == 2  # Ducati + Triumph
        assert all("Mumbai" in d["location"] for d in data)

    def test_combined_filters(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/", params={
            "min_price": 1500000,
            "engine_config": "V-Twin",
            "min_bhp": 100,
        })
        data = resp.json()
        # Only Ducati Panigale matches (Harley bhp=93 < 100)
        assert len(data) == 1
        assert data[0]["make"] == "Ducati"


# ===================================================================
# 3. Search Result Ordering
# ===================================================================

class TestSearchOrdering:
    """Results must be sorted by transparency_score DESC then created_at DESC."""

    def test_ordered_by_transparency_score_desc(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/")
        data = resp.json()
        scores = [d["transparency_score"] for d in data]
        assert scores == sorted(scores, reverse=True)


# ===================================================================
# 4. Pagination
# ===================================================================

class TestPagination:

    def test_limit(self, db):
        _seed_active_listings(db)
        resp = client.get("/listings/", params={"limit": 2})
        assert len(resp.json()) == 2

    def test_skip(self, db):
        _seed_active_listings(db)
        all_resp = client.get("/listings/")
        skip_resp = client.get("/listings/", params={"skip": 2})
        assert skip_resp.json() == all_resp.json()[2:]

    def test_limit_max_100(self):
        resp = client.get("/listings/", params={"limit": 200})
        assert resp.status_code == 422  # limit > 100 is rejected


# ===================================================================
# 5. Admin Status Transitions
# ===================================================================

class TestAdminStatusUpdate:
    """PATCH /listings/{id}/status — admin-only lifecycle changes."""

    def test_admin_can_activate_listing(self, db):
        seller = _make_seller(db)
        admin = _make_admin(db)

        # Create listing (DRAFT)
        create_resp = client.post(
            "/listings/",
            json=VALID_LISTING_PAYLOAD,
            headers=_auth_header(_token_for(seller)),
        )
        listing_id = create_resp.json()["id"]

        # Admin activates it
        resp = client.patch(
            f"/listings/{listing_id}/status",
            json={"status": "active", "score_bump": 25},
            headers=_auth_header(_token_for(admin)),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "active"
        assert data["transparency_score"] == 25

    def test_transparency_score_capped_at_100(self, db):
        seller = _make_seller(db)
        admin = _make_admin(db)

        create_resp = client.post(
            "/listings/",
            json=VALID_LISTING_PAYLOAD,
            headers=_auth_header(_token_for(seller)),
        )
        listing_id = create_resp.json()["id"]

        # Bump by 60
        client.patch(
            f"/listings/{listing_id}/status",
            json={"status": "active", "score_bump": 60},
            headers=_auth_header(_token_for(admin)),
        )
        # Bump by another 60 (should cap at 100)
        resp = client.patch(
            f"/listings/{listing_id}/status",
            json={"status": "active", "score_bump": 60},
            headers=_auth_header(_token_for(admin)),
        )
        assert resp.json()["transparency_score"] == 100

    def test_non_admin_cannot_update_status(self, db):
        seller = _make_seller(db)
        create_resp = client.post(
            "/listings/",
            json=VALID_LISTING_PAYLOAD,
            headers=_auth_header(_token_for(seller)),
        )
        listing_id = create_resp.json()["id"]

        # Seller tries to activate — forbidden
        resp = client.patch(
            f"/listings/{listing_id}/status",
            json={"status": "active"},
            headers=_auth_header(_token_for(seller)),
        )
        assert resp.status_code == 403

    def test_buyer_cannot_update_status(self, db):
        seller = _make_seller(db)
        buyer = _make_buyer(db)
        create_resp = client.post(
            "/listings/",
            json=VALID_LISTING_PAYLOAD,
            headers=_auth_header(_token_for(seller)),
        )
        listing_id = create_resp.json()["id"]

        resp = client.patch(
            f"/listings/{listing_id}/status",
            json={"status": "active"},
            headers=_auth_header(_token_for(buyer)),
        )
        assert resp.status_code == 403

    def test_update_nonexistent_listing_404(self, db):
        admin = _make_admin(db)
        resp = client.patch(
            "/listings/99999/status",
            json={"status": "active"},
            headers=_auth_header(_token_for(admin)),
        )
        assert resp.status_code == 404


# ===================================================================
# 6. VerificationLog Model Integrity
# ===================================================================

class TestVerificationLogModel:
    """Direct ORM tests for the VerificationLog audit table."""

    def test_create_verification_log(self, db):
        seller = _make_seller(db)
        listing = Listing(
            seller_id=seller.id, make="Ducati", model="V4", year=2023,
            price=2500000, odometer=5000, engine_config=EngineConfig.V_TWIN,
            body_type=BodyType.SUPERSPORT, bhp=215.5, location="Mumbai",
            status=ListingStatus.DRAFT, transparency_score=0,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        log = VerificationLog(
            listing_id=listing.id,
            document_type="RC",
            s3_reference_id="abc-123-unique-key",
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        assert log.id is not None
        assert log.listing_id == listing.id
        assert log.document_type == "RC"
        assert log.s3_reference_id == "abc-123-unique-key"

    def test_verification_log_relationship(self, db):
        seller = _make_seller(db)
        listing = Listing(
            seller_id=seller.id, make="BMW", model="S1000RR", year=2023,
            price=2200000, odometer=3000, engine_config=EngineConfig.INLINE_4,
            body_type=BodyType.SUPERSPORT, bhp=205, location="Delhi",
            status=ListingStatus.DRAFT, transparency_score=0,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        log1 = VerificationLog(listing_id=listing.id, document_type="RC", s3_reference_id="key-1")
        log2 = VerificationLog(listing_id=listing.id, document_type="SERVICE", s3_reference_id="key-2")
        db.add_all([log1, log2])
        db.commit()
        db.refresh(listing)

        assert len(listing.verification_logs) == 2
        types = {vl.document_type for vl in listing.verification_logs}
        assert types == {"RC", "SERVICE"}

    def test_verification_log_unique_s3_key(self, db):
        """Duplicate s3_reference_id must raise IntegrityError."""
        from sqlalchemy.exc import IntegrityError

        seller = _make_seller(db)
        listing = Listing(
            seller_id=seller.id, make="Triumph", model="Street Triple",
            year=2022, price=1000000, odometer=8000,
            engine_config=EngineConfig.TRIPLE, body_type=BodyType.NAKED,
            bhp=120, location="Pune", status=ListingStatus.DRAFT,
            transparency_score=0,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        log1 = VerificationLog(listing_id=listing.id, document_type="RC", s3_reference_id="dup-key")
        db.add(log1)
        db.commit()

        log2 = VerificationLog(listing_id=listing.id, document_type="SERVICE", s3_reference_id="dup-key")
        db.add(log2)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

    def test_cascade_delete(self, db):
        """Deleting a listing must cascade-delete its verification logs.

        Note: SQLite does not enforce ON DELETE CASCADE at the DB level
        by default. The ORM-level ``cascade='all, delete-orphan'`` on
        ``Listing.verification_logs`` handles this, but requires the
        relationship to be loaded before the parent is deleted.
        """
        seller = _make_seller(db)
        listing = Listing(
            seller_id=seller.id, make="KTM", model="1290 Super Duke",
            year=2023, price=1900000, odometer=2000,
            engine_config=EngineConfig.V_TWIN, body_type=BodyType.NAKED,
            bhp=180, location="Hyderabad", status=ListingStatus.DRAFT,
            transparency_score=0,
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        log = VerificationLog(listing_id=listing.id, document_type="PUC", s3_reference_id="puc-key-1")
        db.add(log)
        db.commit()

        # Re-fetch listing to ensure the relationship is loaded (triggers selectin)
        listing = db.get(Listing, listing.id)
        _ = listing.verification_logs  # force-load

        # Delete the parent listing — ORM cascade will delete children
        db.delete(listing)
        db.commit()

        # Verification log should be gone
        remaining = db.query(VerificationLog).all()
        assert remaining == []
