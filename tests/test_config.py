import pytest
from pydantic import ValidationError

from app.config import Settings


def production_settings(**overrides):
    values = {
        "ENVIRONMENT": "production",
        "DATABASE_URL": "postgresql://user:password@db.example.com:5432/torquetrader",
        "JWT_SECRET_KEY": "a" * 64,
        "REDIS_URL": "redis://redis.example.com:6379/0",
        "RESEND_API_KEY": "re_example",
        "OTP_FROM_EMAIL": "noreply@example.com",
        "R2_ACCOUNT_ID": "account",
        "R2_ACCESS_KEY_ID": "access-key",
        "R2_SECRET_ACCESS_KEY": "secret-key",
        "ALLOWED_ORIGINS": "https://app.example.com",
    }
    values.update(overrides)
    return values


def test_production_settings_require_explicit_services():
    with pytest.raises(ValidationError, match="REDIS_URL"):
        Settings(**production_settings(REDIS_URL=None))


def test_production_settings_reject_wildcard_cors():
    with pytest.raises(ValidationError, match="ALLOWED_ORIGINS"):
        Settings(**production_settings(ALLOWED_ORIGINS="*"))


def test_production_settings_reject_example_secret():
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        Settings(**production_settings(JWT_SECRET_KEY="CHANGE_ME_generate_a_64_byte_random_string"))


def test_complete_production_settings_are_accepted():
    settings = Settings(**production_settings())
    assert settings.ENVIRONMENT == "production"
