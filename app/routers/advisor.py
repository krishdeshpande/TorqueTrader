"""
TorqueTrader — Automotive Advisory & Paid 1-on-1 Consultation Router.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from app.services.auto_advisor import generate_advisory_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/advisor", tags=["Automotive Advisory & Consulting"])


class DiagnosticAnalysisRequest(BaseModel):
    budget: str = Field(default="₹12L - ₹20L")
    condition: str = Field(default="New or Used")
    city: str = Field(default="Mumbai / Delhi-NCR / Bangalore")
    usage: str = Field(default="Daily Commute & Highway")
    priorities: List[str] = Field(default_factory=lambda: ["Safety", "Comfort", "Low Maintenance"])
    contenders: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)


class ConsultationBookingRequest(BaseModel):
    client_name: str
    client_email: str
    client_phone: str
    tier_id: str  # "strategy_call" | "chat_advisory" | "dossier_audit" | "concierge"
    tier_title: str
    tier_price: int
    budget_range: Optional[str] = None
    target_vehicle: Optional[str] = None
    preferred_slot: Optional[str] = None
    notes: Optional[str] = None


@router.post(
    "/analyze",
    summary="Generate priority-calibrated automotive advisory dossier",
)
def analyze_vehicle_query(payload: DiagnosticAnalysisRequest) -> Dict[str, Any]:
    """Execute AI/expert advisory analysis for vehicle purchase decisions."""
    try:
        result = generate_advisory_analysis(payload.model_dump())
        return result
    except Exception as exc:
        logger.error("Advisory analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate advisory dossier. Please try again.",
        )


@router.post(
    "/consultation-booking",
    summary="Book a private 1-on-1 automotive consultation",
)
def book_consultation(payload: ConsultationBookingRequest) -> Dict[str, Any]:
    """Capture consultation lead and return confirmation."""
    booking_id = f"TT-CONSULT-{int(datetime.now(timezone.utc).timestamp())}"
    logger.info("New consultation booking received: %s for %s (%s)", booking_id, payload.client_name, payload.tier_title)
    
    return {
        "success": True,
        "booking_id": booking_id,
        "client_name": payload.client_name,
        "tier_title": payload.tier_title,
        "tier_price": payload.tier_price,
        "message": f"Consultation request confirmed. Our lead automotive consultant will reach out on WhatsApp/Email ({payload.client_phone}) within 2 hours to confirm your session slot.",
    }
