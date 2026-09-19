from __future__ import annotations

import fakeredis
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.database import get_db
from app.main import app
from app.models.base import Base
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import VerifyOTPRequest
from app.services.auth_service import verify_otp_and_login


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
def database_override():
    Base.metadata.create_all(bind=engine)
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_overrides)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token({"sub": user.email, "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


def test_otp_requires_exactly_six_numeric_digits():
    with pytest.raises(ValidationError):
        VerifyOTPRequest(email="rider@example.com", otp="12345a")
    with pytest.raises(ValidationError):
        VerifyOTPRequest(email="rider@example.com", otp="12345")


def test_new_otp_user_uses_email_identity_and_requires_profile(db):
    redis = fakeredis.FakeRedis(decode_responses=True)
    redis.setex("otp:rider@example.com", 300, "123456")

    result = verify_otp_and_login(
        VerifyOTPRequest(email="rider@example.com", otp="123456"),
        db,
        redis,
    )

    user = db.query(User).filter_by(email="rider@example.com").one()
    assert result["access_token"]
    assert user.email == "rider@example.com"
    assert user.phone_number is None
    assert user.profile_completed is False


def test_authenticated_profile_completion_updates_only_profile_fields(db):
    user = User(
        email="rider@example.com",
        role=UserRole.buyer,
        status=UserStatus.active,
        profile_completed=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    client = TestClient(app)
    response = client.put(
        "/auth/profile",
        headers=_auth_header(user),
        json={
            "first_name": "Asha",
            "last_name": "Rider",
            "phone_number": "+91 98765 43210",
            "riding_experience": "experienced",
            "riding_duration_months": 36,
            "bike_preferences": ["Naked", "ADV"],
            "intent": "buy",
            "city": "Bengaluru",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "rider@example.com"
    assert data["phone_number"] == "+91 98765 43210"
    assert data["profile_completed"] is True
    assert data["bike_preferences"] == ["Naked", "ADV"]


def test_completed_user_profile_state_is_returned_after_login(db):
    user = User(
        email="complete@example.com",
        phone_number="+91 91234 56789",
        role=UserRole.buyer,
        status=UserStatus.active,
        profile_completed=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    response = TestClient(app).get("/auth/me", headers=_auth_header(user))

    assert response.status_code == 200
    assert response.json()["profile_completed"] is True
