from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any


class SendOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to send the OTP to.")


class VerifyOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address the OTP was sent to.")
    otp: str = Field(
        ...,
        pattern=r"^\d{6}$",
        description="Exactly six numeric digits.",
    )


class TokenResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    access_token: str
    token_type: str
    role: str
    user: Optional[Dict[str, Any]] = None


class DealerRegistrationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address for dealer account.")
