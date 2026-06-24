"""
TorqueTrader — Auth service.

OTP delivery: Resend email API (https://resend.com).
  - Free tier: 3,000 emails/month, 100/day — sufficient for early launch.
  - If RESEND_API_KEY is not set, OTP is printed to stdout (dev only).

OTP state: stored in Redis with TTL. Brute-force protected via attempt counter.
"""

import logging
import random

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest
from app.core.security import create_access_token
from datetime import timedelta

logger = logging.getLogger(__name__)


# ── OTP delivery ──────────────────────────────────────────────────────────────

def _send_otp_email(email: str, otp: str) -> None:
    """Send OTP via Resend email API, or log to stdout in dev."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — printing OTP to stdout (dev mode only).")
        print(f"[DEV] OTP for {email}: {otp}")
        return

    import resend
    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.OTP_FROM_EMAIL,
            "to": email,
            "subject": "Your TorqueTrader verification code",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2 style="color:#1a1a1a">TorqueTrader</h2>
              <p>Your verification code is:</p>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                          color:#d62828;margin:24px 0">{otp}</div>
              <p style="color:#666">This code expires in 5 minutes.<br>
              If you didn't request this, ignore this email.</p>
            </div>
            """,
        })
    except Exception as exc:
        logger.error("Resend email failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP email. Please try again.",
        )


# ── Service functions ─────────────────────────────────────────────────────────

def send_otp(request: SendOTPRequest, redis) -> dict:
    identifier = request.email  # email-based OTP

    # Brute-force protection
    attempts_key = f"otp_attempts:{identifier}"
    attempts = redis.get(attempts_key)
    if attempts and int(attempts) >= settings.MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again in 1 hour.",
        )

    redis.incr(attempts_key)
    if not attempts:
        redis.expire(attempts_key, 3600)  # 1-hour lockout window

    otp = str(random.randint(100000, 999999))
    redis.setex(f"otp:{identifier}", settings.OTP_TTL_SECONDS, otp)

    _send_otp_email(identifier, otp)
    return {"message": "OTP sent to your email address."}


def verify_otp_and_login(request: VerifyOTPRequest, db: Session, redis) -> dict:
    identifier = request.email
    stored_otp = redis.get(f"otp:{identifier}")

    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP.",
        )

    # Consume the OTP
    redis.delete(f"otp:{identifier}")
    redis.delete(f"otp_attempts:{identifier}")

    # Get or create user (keyed by email, stored in phone_number column for now)
    user = db.query(User).filter(User.phone_number == identifier).first()
    if not user:
        user = User(
            phone_number=identifier,
            role=UserRole.buyer,
            status=UserStatus.active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.status == UserStatus.suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended.",
        )

    access_token = create_access_token(
        data={"sub": user.phone_number, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
    }


def blacklist_token(token: str, redis) -> None:
    """Add token to Redis blacklist (logout)."""
    redis.setex(
        f"blacklist:{token}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "true",
    )
