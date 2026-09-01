from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "TorqueTrader API"
    VERSION: str = "1.0.0"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./torque_trader.db"

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "86272e2e8f69043565734ee0af6e3dca"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── OTP (via Resend email) ────────────────────────────────────────────────
    OTP_TTL_SECONDS: int = 300       # 5 minutes
    MAX_OTP_ATTEMPTS: int = 5
    RESEND_API_KEY: Optional[str] = None          # Required in production for emails
    OTP_FROM_EMAIL: str = "noreply@torquetrader.in"

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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
