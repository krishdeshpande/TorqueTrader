from typing import Literal, Optional
import logging
from pydantic import ConfigDict, model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "TorqueTrader API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./torque_trader.db"

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "86272e2e8f69043565734ee0af6e3dca09bf"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Admin / Founder Alert Notifications ──────────────────────────────────
    FOUNDER_EMAIL: str = "krishdeshpande16@gmail.com"

    # ── OTP (via Resend email) ────────────────────────────────────────────────
    OTP_TTL_SECONDS: int = 300       # 5 minutes
    MAX_OTP_ATTEMPTS: int = 5
    RESEND_API_KEY: Optional[str] = None          # Optional in dev; recommended in prod
    OTP_FROM_EMAIL: str = "noreply@torquetrader.in"

    # ── Redis ────────────────────────────────────────────────────────────────
    REDIS_URL: Optional[str] = None

    # ── Live mParivahan / VAHAN RC API Provider ──────────────────────────────
    VAHAN_API_KEY: Optional[str] = None
    VAHAN_API_PROVIDER: str = "surepass"          # "surepass" | "rapidapi" | "sandbox"

    # ── Gemini Automotive AI Advisor ─────────────────────────────────────────
    GEMINI_API_KEY: Optional[str] = None

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
        if self.ENVIRONMENT == "production":
            if not self.REDIS_URL:
                raise ValueError("REDIS_URL is required in production environment")
            if "CHANGE_ME" in self.JWT_SECRET_KEY or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError("JWT_SECRET_KEY must be a secure random secret")
        return self


settings = Settings()
