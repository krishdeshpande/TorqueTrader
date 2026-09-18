"""
TorqueTrader — Pydantic schemas for user profile onboarding.
"""

from __future__ import annotations

import enum
import re
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RidingExperience(str, enum.Enum):
    new = "new"
    experienced = "experienced"


class MarketplaceIntent(str, enum.Enum):
    buy = "buy"
    sell = "sell"
    both = "both"
    browse = "browse"


class ProfileUpdateRequest(BaseModel):
    """Schema for the onboarding profile submission (PUT /auth/profile)."""

    first_name: str = Field(
        ..., min_length=1, max_length=100, description="User's first name."
    )
    last_name: str = Field(
        ..., min_length=1, max_length=100, description="User's last name."
    )
    phone_number: str = Field(
        ..., min_length=7, max_length=20, description="Contact phone number."
    )
    riding_experience: RidingExperience = Field(
        ..., description="Riding experience level."
    )

    # Optional fields
    riding_duration_months: Optional[int] = Field(
        None, ge=0, le=1200, description="Total riding duration in months."
    )
    current_bikes: Optional[List[str]] = Field(
        default_factory=list, description="List of currently owned motorcycles."
    )
    previous_bikes: Optional[List[str]] = Field(
        default_factory=list, description="List of previously owned motorcycles."
    )
    bike_preferences: Optional[List[str]] = Field(
        default_factory=list, description="Preferred motorcycle types."
    )
    intent: Optional[MarketplaceIntent] = Field(
        None, description="What brings the user to TorqueTrader."
    )
    city: Optional[str] = Field(
        None, max_length=200, description="User's city."
    )
    dream_bike: Optional[str] = Field(
        None, max_length=200, description="User's dream motorcycle."
    )

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        # Allow digits, spaces, dashes, plus sign, parentheses
        if not re.match(r"^[\d\s\-+()]{7,20}$", cleaned):
            raise ValueError("Invalid phone number format.")
        return cleaned

    @field_validator("riding_duration_months")
    @classmethod
    def clear_duration_for_new_rider(cls, v, info):
        # This is validated at the service layer too, but we allow it
        # to pass through here since riding_experience might clear it.
        return v

    @field_validator("bike_preferences")
    @classmethod
    def validate_preferences(cls, v: list) -> list:
        allowed = {
            "Sport", "Naked", "Superbike", "Cruiser", "ADV",
            "Touring", "Retro / Classic", "Scrambler", "Electric",
        }
        if v:
            invalid = [p for p in v if p not in allowed]
            if invalid:
                raise ValueError(f"Invalid bike preferences: {invalid}")
        return v

    @field_validator("current_bikes", "previous_bikes")
    @classmethod
    def limit_bike_list(cls, v: list) -> list:
        if v and len(v) > 20:
            raise ValueError("Too many entries (max 20).")
        return [b.strip() for b in v if b and b.strip()]


class ProfileResponse(BaseModel):
    """Full user profile returned by GET /auth/me."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    phone_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    riding_experience: Optional[str] = None
    riding_duration_months: Optional[int] = None
    current_bikes: List[str] = []
    previous_bikes: List[str] = []
    bike_preferences: List[str] = []
    intent: Optional[str] = None
    city: Optional[str] = None
    dream_bike: Optional[str] = None
    profile_completed: bool = False
    role: str
    status: str
