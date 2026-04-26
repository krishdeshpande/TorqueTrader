from pydantic import BaseModel, Field
from typing import Optional

class SendOTPRequest(BaseModel):
    phone_number: str = Field(..., description="The user's phone number")

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class DealerRegistrationRequest(BaseModel):
    phone_number: str
    # Other dealer details would go here (e.g. dealership name, address)
