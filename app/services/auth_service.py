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

    print("=" * 60)
    print("!!! EMAIL SENDING DEBUG INFO !!!")
    print("=" * 60)

    resend_api_key = settings.RESEND_API_KEY
    from_email = settings.OTP_FROM_EMAIL

    print("RESEND_API_KEY present:", bool(resend_api_key))
    print("OTP_FROM_EMAIL:", from_email)
    print("Sending email to:", email)

    if not resend_api_key:
        print("✗ RESEND_API_KEY is missing!")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured.",
        )

    if not from_email:
        print("✗ OTP_FROM_EMAIL is missing!")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email sender is not configured.",
        )

    resend.api_key = resend_api_key

    try:
        result = resend.Emails.send({
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

        print("✓ RESEND ACCEPTED EMAIL")
        print("Resend response:", result)
        print("=" * 60)

    except Exception as exc:
        print("✗ RESEND FAILED")
        print("Error:", repr(exc))
        print("Error type:", type(exc).__name__)
        print("=" * 60)

        logger.exception("Resend email failed")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP email. Please try again.",
        )


# ── Service functions ─────────────────────────────────────────────────────────

def send_otp(request: SendOTPRequest, redis) -> dict:
    identifier = request.email

    print(f"\n>>> SEND_OTP CALLED FOR: {identifier}")

    # Brute-force / spam protection
    attempts_key = f"otp_attempts:{identifier}"
    attempts = redis.get(attempts_key)

    if attempts and int(attempts) >= settings.MAX_OTP_ATTEMPTS:
        print(f"!!! TOO MANY ATTEMPTS FOR: {identifier}")

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

    print(
        f"Generated OTP: {otp} "
        f"(stored in Redis for {settings.OTP_TTL_SECONDS}s)"
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

    # Get or create user.
    # Email is currently stored in phone_number.
    user = (
        db.query(User)
        .filter(User.phone_number == identifier)
        .first()
    )

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

    # Create JWT
    access_token = create_access_token(
        data={
            "sub": user.phone_number,
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