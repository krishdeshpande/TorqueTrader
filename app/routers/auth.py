from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth import (
    SendOTPRequest,
    VerifyOTPRequest,
    TokenResponse,
    DealerRegistrationRequest,
)
from app.schemas.profile import ProfileUpdateRequest, ProfileResponse
from app.services import auth_service
from app.database import get_db
from app.redis_client import get_redis
from app.core.security import oauth2_scheme, get_current_user
from app.models.user import User, UserRole, UserStatus, RidingExperience

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
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    new_dealer = User(
        email=request.email,
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


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get the current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the full profile for the currently logged-in user."""
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        phone_number=current_user.phone_number,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        riding_experience=(
            current_user.riding_experience.value
            if current_user.riding_experience else None
        ),
        riding_duration_months=current_user.riding_duration_months,
        current_bikes=current_user.current_bikes or [],
        previous_bikes=current_user.previous_bikes or [],
        bike_preferences=current_user.bike_preferences or [],
        intent=current_user.intent,
        city=current_user.city,
        dream_bike=current_user.dream_bike,
        profile_completed=current_user.profile_completed,
        role=current_user.role.value,
        status=current_user.status.value,
    )


@router.put(
    "/profile",
    response_model=ProfileResponse,
    summary="Complete or update user profile",
)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save profile data during onboarding. Sets profile_completed=true on success."""

    # Check for duplicate phone number
    if payload.phone_number:
        existing_phone = (
            db.query(User)
            .filter(
                User.phone_number == payload.phone_number,
                User.id != current_user.id,
            )
            .first()
        )
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already associated with another account.",
            )

    # Set required fields
    current_user.first_name = payload.first_name.strip()
    current_user.last_name = payload.last_name.strip()
    current_user.phone_number = payload.phone_number.strip()
    current_user.riding_experience = RidingExperience(payload.riding_experience.value)

    # Handle riding duration: clear if new rider
    if payload.riding_experience == RidingExperience.new:
        current_user.riding_duration_months = None
    else:
        current_user.riding_duration_months = payload.riding_duration_months

    # Optional arrays (default to empty list if None)
    current_user.current_bikes = payload.current_bikes or []
    current_user.previous_bikes = payload.previous_bikes or []
    current_user.bike_preferences = payload.bike_preferences or []

    # Optional scalar fields
    current_user.intent = payload.intent.value if payload.intent else None
    current_user.city = payload.city.strip() if payload.city else None
    current_user.dream_bike = payload.dream_bike.strip() if payload.dream_bike else None

    # Mark profile as completed
    current_user.profile_completed = True

    db.commit()
    db.refresh(current_user)

    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        phone_number=current_user.phone_number,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        riding_experience=(
            current_user.riding_experience.value
            if current_user.riding_experience else None
        ),
        riding_duration_months=current_user.riding_duration_months,
        current_bikes=current_user.current_bikes or [],
        previous_bikes=current_user.previous_bikes or [],
        bike_preferences=current_user.bike_preferences or [],
        intent=current_user.intent,
        city=current_user.city,
        dream_bike=current_user.dream_bike,
        profile_completed=current_user.profile_completed,
        role=current_user.role.value,
        status=current_user.status.value,
    )
