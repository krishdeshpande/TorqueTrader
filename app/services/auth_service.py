import random
import fakeredis
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest
from app.core.security import create_access_token
from datetime import timedelta

def send_otp(request: SendOTPRequest, redis: fakeredis.FakeRedis):
    phone = request.phone_number
    
    # Brute force protection: check attempts
    attempts_key = f"otp_attempts:{phone}"
    attempts = redis.get(attempts_key)
    if attempts and int(attempts) >= settings.MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many OTP requests. Please try again later.")
    
    # Increment attempts
    redis.incr(attempts_key)
    if not attempts: # First attempt, set expiration (e.g. 1 hour lockout)
        redis.expire(attempts_key, 3600)
    
    # Generate OTP (mocked)
    otp = str(random.randint(100000, 999999))
    
    # In a real app, send OTP via SMS here
    print(f"--- MOCK SMS --- Sent OTP {otp} to {phone}")
    
    # Store OTP in Redis
    redis.setex(f"otp:{phone}", settings.OTP_TTL_SECONDS, otp)
    
    return {"message": "OTP sent successfully"}

def verify_otp_and_login(request: VerifyOTPRequest, db: Session, redis: fakeredis.FakeRedis):
    phone = request.phone_number
    stored_otp = redis.get(f"otp:{phone}")
    
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")
    
    # OTP is valid, remove it
    redis.delete(f"otp:{phone}")
    redis.delete(f"otp_attempts:{phone}") # Reset attempts on success
    
    # Get or create user
    user = db.query(User).filter(User.phone_number == phone).first()
    if not user:
        user = User(phone_number=phone, role=UserRole.buyer, status=UserStatus.active)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.status == UserStatus.suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
        
    # Generate JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone_number, "role": user.role.value}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}

def blacklist_token(token: str, redis: fakeredis.FakeRedis):
    # Store token in blacklist with expiration equal to token's TTL
    # For simplicity, we assume max TTL
    redis.setex(f"blacklist:{token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "true")
