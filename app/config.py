from typing import Literal, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "TorqueTrader API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./torque_trader.db"

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── OTP (via Resend email) ────────────────────────────────────────────────
    OTP_TTL_SECONDS: int = 300       # 5 minutes
    MAX_OTP_ATTEMPTS: int = 5
    RESEND_API_KEY: Optional[str] = None          # Required in production for emails
    OTP_FROM_EMAIL: str = ""

    # ── Redis ────────────────────────────────────────────────────────────────
    REDIS_URL: Optional[str] = None

    # ── Live mParivahan / VAHAN RC API Provider ──────────────────────────────
    # Supports Surepass (recommended), RapidAPI, or IDfy
    VAHAN_API_KEY: Optional[str] = None
    VAHAN_API_PROVIDER: str = "surepass"          # "surepass" | "rapidapi" | "sandbox"

    # ── Cloudflare R2 (S3-compatible object storage) ─────────────────────────
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_PUBLIC_BUCKET: str = "torquetrader-public"
    R2_PRIVATE_BUCKET: str = "torquetrader-private"

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "*"

    @model_validator(mode="after")
    def validate_production_settings(self):
        """Fail fast when a production deployment is missing critical services."""
        if self.ENVIRONMENT != "production":
            return self

        required = {
            "DATABASE_URL": self.DATABASE_URL,
            "JWT_SECRET_KEY": self.JWT_SECRET_KEY,
            "REDIS_URL": self.REDIS_URL,
            "RESEND_API_KEY": self.RESEND_API_KEY,
            "OTP_FROM_EMAIL": self.OTP_FROM_EMAIL,
            "R2_ACCOUNT_ID": self.R2_ACCOUNT_ID,
            "R2_ACCESS_KEY_ID": self.R2_ACCESS_KEY_ID,
            "R2_SECRET_ACCESS_KEY": self.R2_SECRET_ACCESS_KEY,
        }
        missing = [name for name, value in required.items() if not value]
        if missing:
            raise ValueError(
                "Production requires the following environment variables: "
                + ", ".join(missing)
            )
        if self.DATABASE_URL.startswith("sqlite"):
            raise ValueError("Production DATABASE_URL must point to PostgreSQL, not SQLite.")
        if len(self.JWT_SECRET_KEY) < 32 or self.JWT_SECRET_KEY.startswith("CHANGE_ME"):
            raise ValueError("Production JWT_SECRET_KEY must be at least 32 characters.")

        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        if not origins or "*" in origins:
            raise ValueError("Production ALLOWED_ORIGINS must contain explicit HTTPS frontend origins.")
        if any(not origin.startswith("https://") for origin in origins):
            raise ValueError("Production ALLOWED_ORIGINS entries must use HTTPS.")
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
