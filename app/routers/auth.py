from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth import (
    SendOTPRequest,
    VerifyOTPRequest,
    TokenResponse,
    DealerRegistrationRequest,
)
from app.services import auth_service
from app.database import get_db
from app.redis_client import get_redis
from app.core.security import oauth2_scheme, get_current_user
from app.models.user import User, UserRole, UserStatus

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", summary="Request an OTP via email")
def send_otp(
    request: SendOTPRequest,
    redis=Depends(get_redis),
):
    """Send a 6-digit OTP to the provided email address."""
    return auth_service.send_otp(request, redis)


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verify OTP and receive JWT",
)
def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
    redis=Depends(get_redis),
):
    """Verify the OTP. Returns a JWT on success and creates the account if new."""
    return auth_service.verify_otp_and_login(request, db, redis)


@router.post("/register-dealer", summary="Register a new dealer account")
def register_dealer(
    request: DealerRegistrationRequest,
    db: Session = Depends(get_db),
):
    """Submit a dealer registration. Account starts in PENDING status."""
    existing = db.query(User).filter(User.phone_number == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    new_dealer = User(
        phone_number=request.email,
        role=UserRole.dealer,
        status=UserStatus.pending,
    )
    db.add(new_dealer)
    db.commit()
    return {"message": "Dealer registration submitted. Pending admin approval."}


@router.post("/logout", summary="Invalidate the current JWT")
def logout(
    token: str = Depends(oauth2_scheme),
    redis=Depends(get_redis),
):
    """Blacklist the current token (logout)."""
    auth_service.blacklist_token(token, redis)
    return {"message": "Logged out successfully."}


@router.get("/me", summary="Get the current authenticated user")
def get_me(current_user: User = Depends(get_current_user)):
    """Return basic profile for the currently logged-in user."""
    return {
        "id": current_user.id,
        "email": current_user.phone_number,
        "role": current_user.role.value,
        "status": current_user.status.value,
    }
