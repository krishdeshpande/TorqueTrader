from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import fakeredis

from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, TokenResponse, DealerRegistrationRequest
from app.services import auth_service
from app.database import get_db
from app.redis_client import get_redis
from app.core.security import oauth2_scheme, get_current_user
from app.models.user import User, UserRole, UserStatus

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/send-otp")
def send_otp(request: SendOTPRequest, redis: fakeredis.FakeRedis = Depends(get_redis)):
    return auth_service.send_otp(request, redis)

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db), redis: fakeredis.FakeRedis = Depends(get_redis)):
    return auth_service.verify_otp_and_login(request, db, redis)

@router.post("/register-dealer")
def register_dealer(request: DealerRegistrationRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.phone_number == request.phone_number).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")
    
    # Create dealer in pending status
    new_dealer = User(
        phone_number=request.phone_number,
        role=UserRole.dealer,
        status=UserStatus.pending
    )
    db.add(new_dealer)
    db.commit()
    db.refresh(new_dealer)
    
    return {"message": "Dealer registration submitted and is pending approval."}

@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme), redis: fakeredis.FakeRedis = Depends(get_redis)):
    auth_service.blacklist_token(token, redis)
    return {"message": "Successfully logged out"}
