from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SendOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to send the OTP to.")


class VerifyOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address the OTP was sent to.")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code.")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class DealerRegistrationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address for dealer account.")
