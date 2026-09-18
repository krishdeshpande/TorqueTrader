"""
TorqueTrader — Auth service.

OTP delivery: Resend email API.
OTP state: Redis with TTL.
Brute-force protection: Redis attempt counter.
"""

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
    """Send OTP via Resend."""

    resend_api_key = settings.RESEND_API_KEY
    from_email = settings.OTP_FROM_EMAIL

    if not resend_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured.",
        )

    if not from_email:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email sender is not configured.",
        )

    resend.api_key = resend_api_key

    try:
        resend.Emails.send({
            "from": f"TorqueTrader <{from_email}>",
            "to": [email],
            "subject": "Your TorqueTrader verification code",
            "html": f"""
            <div style="
                font-family: Arial, sans-serif;
                max-width: 480px;
                margin: 40px auto;
                padding: 24px;
            ">
                <h2 style="color:#1a1a1a;">
                    TorqueTrader
                </h2>

                <p>Your verification code is:</p>

                <div style="
                    font-size:36px;
                    font-weight:bold;
                    letter-spacing:8px;
                    color:#d62828;
                    margin:24px 0;
                ">
                    {otp}
                </div>

                <p style="color:#666;">
                    This code expires in 5 minutes.
                </p>

                <p style="color:#666;">
                    If you didn't request this code, you can safely ignore
                    this email.
                </p>
            </div>
            """,
        })

        logger.info("OTP email accepted by Resend for %s", email)

    except Exception as exc:
        logger.exception("Resend email failed")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP email. Please try again.",
        )


# ── Service functions ─────────────────────────────────────────────────────────

def send_otp(request: SendOTPRequest, redis) -> dict:
    identifier = request.email

    # Brute-force / spam protection
    attempts_key = f"otp_attempts:{identifier}"
    attempts = redis.get(attempts_key)

    if attempts and int(attempts) >= settings.MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again in 1 hour.",
        )

    # Generate secure 6-digit OTP
    otp = str(secrets.randbelow(900000) + 100000)

    # Store OTP in Redis
    redis.setex(
        f"otp:{identifier}",
        settings.OTP_TTL_SECONDS,
        otp,
    )

    # Send email first.
    # Failed email attempts do NOT consume the request limit.
    _send_otp_email(identifier, otp)

    # Only count the request after Resend successfully accepts the email.
    redis.incr(attempts_key)

    if not attempts:
        redis.expire(attempts_key, 3600)

    return {
        "message": "OTP sent to your email address."
    }


def verify_otp_and_login(
    request: VerifyOTPRequest,
    db: Session,
    redis,
) -> dict:

    identifier = request.email

    stored_otp = redis.get(f"otp:{identifier}")

    if isinstance(stored_otp, bytes):
        stored_otp = stored_otp.decode("utf-8")

    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP.",
        )

    # OTP is single-use.
    redis.delete(f"otp:{identifier}")
    redis.delete(f"otp_attempts:{identifier}")

    # Get or create user by email.
    user = (
        db.query(User)
        .filter(User.email == identifier)
        .first()
    )

    if not user:
        user = User(
            email=identifier,
            role=UserRole.buyer,
            status=UserStatus.active,
            profile_completed=False,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    elif user.status == UserStatus.suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended.",
        )

    # Create JWT — sub is the email (authentication identity)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role.value,
        },
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
    }


def blacklist_token(token: str, redis) -> None:
    """Add token to Redis blacklist on logout."""

    redis.setex(
        f"blacklist:{token}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "true",
    )