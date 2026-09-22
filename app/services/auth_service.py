"""
TorqueTrader — Auth service.

OTP delivery: Resend email API (with automatic sandbox domain fallback).
OTP state: Redis / InMemory with TTL.
Brute-force protection: Redis attempt counter.
"""

from __future__ import annotations

import logging
import secrets
from datetime import timedelta

import resend
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest
from app.core.security import create_access_token

logger = logging.getLogger(__name__)


# ── OTP delivery ──────────────────────────────────────────────────────────────

def _send_otp_email(email: str, otp: str) -> None:
    """Send OTP via Resend with smart fallback."""
    resend_api_key = settings.RESEND_API_KEY
    from_email = settings.OTP_FROM_EMAIL or "noreply@torquetrader.in"

    if not resend_api_key:
        logger.warning(
            "\n"
            "==========================================================\n"
            " [DEV/TEST MODE - NO RESEND API KEY CONFIGURED]\n"
            " OTP for %s is: %s\n"
            "==========================================================",
            email,
            otp,
        )
        return

    resend.api_key = resend_api_key

    html_template = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 8px;">
        <h2 style="color:#111827; margin-bottom: 8px;">TorqueTrader Authentication</h2>
        <p style="color: #4B5563; font-size: 14px;">Your one-time sign-in code is:</p>
        <div style="font-size:36px; font-weight:bold; letter-spacing:8px; color:#B91C1C; margin:20px 0; font-family: monospace;">
            {otp}
        </div>
        <p style="color:#6B7280; font-size: 13px;">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
    </div>
    """

    # Attempt 1: Send with configured domain email
    try:
        resend.Emails.send({
            "from": f"TorqueTrader <{from_email}>",
            "to": [email],
            "subject": f"Your TorqueTrader code: {otp}",
            "html": html_template,
        })
        logger.info("OTP email delivered via %s to %s", from_email, email)
        return
    except Exception as exc1:
        logger.warning("Primary email send via %s failed (%s). Retrying with onboarding@resend.dev...", from_email, exc1)

    # Attempt 2: Fallback to Resend verified test domain
    try:
        resend.Emails.send({
            "from": "TorqueTrader <onboarding@resend.dev>",
            "to": [email],
            "subject": f"Your TorqueTrader code: {otp}",
            "html": html_template,
        })
        logger.info("OTP email delivered via onboarding@resend.dev to %s", email)
    except Exception as exc2:
        logger.error("All Resend delivery attempts failed: %s. OTP for %s is %s", exc2, email, otp)


# ── Service functions ─────────────────────────────────────────────────────────

def send_otp(request: SendOTPRequest, redis) -> dict:
    identifier = request.email.strip().lower()

    # Brute-force / spam protection
    attempts_key = f"otp_attempts:{identifier}"
    attempts = redis.get(attempts_key)

    if attempts and int(attempts) >= settings.MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again in 15 minutes.",
        )

    # Generate 6-digit numeric OTP
    otp = str(secrets.randbelow(900000) + 100000)

    # Store in Redis
    otp_key = f"otp:{identifier}"
    redis.set(otp_key, otp, ex=settings.OTP_TTL_SECONDS)

    # Increment attempt counter (15-min lockout window)
    pipe = redis.pipeline()
    pipe.incr(attempts_key)
    pipe.expire(attempts_key, 900)
    pipe.execute()

    # Deliver via email
    _send_otp_email(identifier, otp)

    return {
        "message": f"Verification code sent to {identifier}",
        "expires_in": settings.OTP_TTL_SECONDS,
    }


def verify_otp(request: VerifyOTPRequest, redis, db: Session) -> dict:
    identifier = request.email.strip().lower()
    user_otp = request.otp.strip()

    otp_key = f"otp:{identifier}"
    stored_otp = redis.get(otp_key)

    if isinstance(stored_otp, bytes):
        stored_otp = stored_otp.decode("utf-8")

    # In dev/testing without Redis or if fallback is used
    is_valid = (stored_otp and stored_otp == user_otp) or (user_otp == "123456" and not settings.RESEND_API_KEY)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    # Delete OTP after successful use
    redis.delete(otp_key)
    redis.delete(f"otp_attempts:{identifier}")

    # Find or create user
    user = db.query(User).filter(User.email == identifier).first()

    if not user:
        user = User(
            email=identifier,
            role=UserRole.SELLER,
            status=UserStatus.ACTIVE,
            profile_completed=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact support.",
        )

    # Issue JWT token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
            "profile_completed": getattr(user, "profile_completed", True),
        },
    }