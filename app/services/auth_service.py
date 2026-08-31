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
    
    # DEBUG: Print all environment info
    print("=" * 60)
    print("!!! EMAIL SENDING DEBUG INFO !!!")
    print("=" * 60)
    
    # Try to get the API key from multiple possible locations
    resend_api_key = None
    
    # First try: standard RESEND_API_KEY
    if hasattr(settings, 'RESEND_API_KEY') and settings.RESEND_API_KEY:
        resend_api_key = settings.RESEND_API_KEY
        print(f"✓ Found RESEND_API_KEY: {resend_api_key[:10]}...")
    
    # Second try: TorqueTrader-Prod (which we saw in your env)
    if not resend_api_key and hasattr(settings, 'TorqueTrader_Prod') and settings.TorqueTrader_Prod:
        resend_api_key = settings.TorqueTrader_Prod
        print(f"✓ Found TorqueTrader_Prod key: {resend_api_key[:10]}...")
    
    # Third try: direct access
    if not resend_api_key:
        try:
            import os
            resend_api_key = os.getenv('RESEND_API_KEY') or os.getenv('TorqueTrader-Prod')
            if resend_api_key:
                print(f"✓ Found via os.getenv: {resend_api_key[:10]}...")
        except:
            pass
    
    if not resend_api_key:
        print("✗ NO RESEND API KEY FOUND ANYWHERE!")
        print(f"[DEV] OTP for {email}: {otp}")
        print("=" * 60)
        return
    
    print(f"Using API key: {resend_api_key[:10]}...")
    
    # Get from email
    from_email = None
    if hasattr(settings, 'OTP_FROM_EMAIL') and settings.OTP_FROM_EMAIL:
        from_email = settings.OTP_FROM_EMAIL
        print(f"✓ OTP_FROM_EMAIL: {from_email}")
    else:
        from_email = "noreply@torquetrader.in"  # Default fallback
        print(f" OTP_FROM_EMAIL not set, using default: {from_email}")
    
    print("=" * 60)
    
    import resend
    resend.api_key = resend_api_key
    
    logger.info("Sending OTP email to %s from %s", email, from_email)
    print(f"Sending email to: {email}")
    print(f"Sending email from: {from_email}")
    
    try:
        result = resend.Emails.send({
            "from": f"TorqueTrader <{from_email}>",
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
        logger.info("Resend email sent successfully: %s", result)
        print(f"✓✓✓ EMAIL SENT SUCCESSFULLY! Result: {result}")
        print("=" * 60)
    except Exception as exc:
        logger.error("Resend email failed: %r", exc, exc_info=True)
        print(f"✗✗✗ EMAIL FAILED! Error: {exc}")
        print(f"Error type: {type(exc)}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP email. Please try again.",
        )


# ─ Service functions ─────────────────────────────────────────────────────────

def send_otp(request: SendOTPRequest, redis) -> dict:
    identifier = request.email  # email-based OTP
    
    print(f"\n>>> SEND_OTP CALLED for: {identifier}")

    # Brute-force protection
    attempts_key = f"otp_attempts:{identifier}"
    attempts = redis.get(attempts_key)
    if attempts and int(attempts) >= settings.MAX_OTP_ATTEMPTS:
        print(f"!!! TOO MANY ATTEMPTS for {identifier}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again in 1 hour.",
        )

    redis.incr(attempts_key)
    if not attempts:
        redis.expire(attempts_key, 3600)  # 1-hour lockout window

    otp = str(random.randint(100000, 999999))
    redis.setex(f"otp:{identifier}", settings.OTP_TTL_SECONDS, otp)
    
    print(f"Generated OTP: {otp} (stored in Redis with TTL {settings.OTP_TTL_SECONDS}s)")

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