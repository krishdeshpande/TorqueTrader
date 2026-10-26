"""
Automated Acceptance Tests for TorqueTrader Group Car & Insurance Buying Platform.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.database import get_db
from app.services.group_buying_service import ensure_seed_data

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def setup_group_buying_test_db():
    Base.metadata.create_all(bind=engine)
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = _override_get_db

    session = TestingSessionLocal()
    ensure_seed_data(session)
    session.close()

    yield

    app.dependency_overrides = original_overrides


client = TestClient(app)


def test_catalog_endpoint():
    """Verify vehicle catalog returns pre-seeded makes and variants."""
    res = client.get("/group-buying/catalog")
    assert res.status_code == 200
    catalog = res.json()
    assert len(catalog) >= 5
    models = [c["model"] for c in catalog]
    assert "Creta" in models
    assert "Slavia" in models


def test_mumbai_creta_20_buyer_group_and_quotations():
    """Verify the core Mumbai 20-customer Creta group is seeded with 3 competing dealership bids."""
    res = client.get("/group-buying/groups")
    assert res.status_code == 200
    groups = res.json()
    creta_group = next((g for g in groups if "Creta" in g["title"]), None)
    assert creta_group is not None
    assert creta_group["city"] == "Mumbai"
    assert creta_group["target_members"] == 20
    assert creta_group["member_count"] >= 20

    # Fetch detail with quotations
    detail_res = client.get(f"/group-buying/groups/{creta_group['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["quotations"]) == 3

    # Verify best offer is Modi Hyundai with lowest net on-road
    best_quote = next((q for q in detail["quotations"] if q["is_best_offer"]), None)
    assert best_quote is not None
    assert best_quote["final_net_on_road"] == 1850000.0
    assert best_quote["total_group_discount"] == 315000.0
    assert "Modi Hyundai" in best_quote["dealer_name"]


def test_join_group_and_prevent_duplicate_membership():
    """Verify a buyer can join a pool and duplicate membership is rejected with 400."""
    res = client.get("/group-buying/groups")
    group_id = res.json()[0]["id"]

    test_email = f"test.rider.{pytest.__version__}@demo.in"
    join_payload = {
        "buyer_name": "Test Rider",
        "buyer_email": test_email,
        "buyer_phone": "+91 98200 44332",
        "pool_group_insurance": True,
        "purchase_timeline": "Within 30 Days",
        "purchase_readiness": "ready_to_buy",
    }

    # First join: success
    join_res = client.post(f"/group-buying/groups/{group_id}/join", json=join_payload)
    assert join_res.status_code == 200
    assert join_res.json()["status"] == "success"

    # Duplicate join: 400 Bad Request
    dup_res = client.post(f"/group-buying/groups/{group_id}/join", json=join_payload)
    assert dup_res.status_code == 400
    assert "already an active member" in dup_res.json()["detail"]


def test_buyer_offer_decision_callback():
    """Verify buyer can accept an offer and route callback to the dealership."""
    res = client.get("/group-buying/groups")
    creta_group = next((g for g in res.json() if "Creta" in g["title"]), res.json()[0])

    detail = client.get(f"/group-buying/groups/{creta_group['id']}").json()
    quote = detail["quotations"][0]

    dec_res = client.post("/group-buying/quotes/decision", json={
        "group_id": creta_group["id"],
        "quotation_id": quote["id"],
        "buyer_name": "Kavita Saxena",
        "buyer_email": "kavita.demo@test.com",
        "buyer_phone": "+91 98200 12345",
        "decision": "callback_requested",
        "preferred_contact_method": "whatsapp",
        "notes": "Please share delivery date options for white color.",
    })
    assert dec_res.status_code == 200
    data = dec_res.json()
    assert data["status"] == "success"
    assert "sales desk will reach out" in data["message"]


def test_admin_metrics_summary():
    """Verify platform admin analytics returns aggregated buyers, dealers, and savings."""
    res = client.get("/group-buying/admin/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_active_groups"] >= 2
    assert data["total_ready_buyers"] >= 30
    assert data["total_verified_dealers"] >= 3
    assert data["total_estimated_community_savings_inr"] > 1000000
