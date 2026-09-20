"""
TorqueTrader — Automotive Advisory & Paid 1-on-1 Consultation Router.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import resend

from app.database import get_db
from app.config import settings
from app.models.consultation import ConsultationBooking
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
    tier_id: str
    tier_title: str
    tier_price: int
    budget_range: Optional[str] = None
    target_vehicle: Optional[str] = None
    notes: Optional[str] = None


def _send_founder_alert(booking: ConsultationBooking):
    """Send instant email notification to founder via Resend when a new consultation is booked."""
    if not settings.RESEND_API_KEY:
        logger.info("[ALERT] New Consultation Lead: %s (%s) - Rs %s", booking.client_name, booking.client_phone, booking.tier_price)
        return

    try:
        resend.api_key = settings.RESEND_API_KEY
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px;">
            <div style="background: #111827; color: #FFFFFF; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px;">New Paid Consultation Request!</h2>
            </div>
            <p><strong>Booking Ref:</strong> {booking.booking_ref}</p>
            <p><strong>Client Name:</strong> {booking.client_name}</p>
            <p><strong>Phone / WhatsApp:</strong> <a href="https://wa.me/91{booking.client_phone.replace('+', '').replace(' ', '')}" style="color: #15803D; font-weight: bold;">{booking.client_phone} (Open WhatsApp)</a></p>
            <p><strong>Email:</strong> {booking.client_email}</p>
            <p><strong>Tier:</strong> {booking.tier_title} (Rs {booking.tier_price:,})</p>
            <p><strong>Budget:</strong> {booking.budget_range or 'Not specified'}</p>
            <p><strong>Target Vehicle / Dilemma:</strong> {booking.target_vehicle or 'Open'}</p>
            <p><strong>Notes:</strong> {booking.notes or 'None'}</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 13px; color: #6B7280;">TorqueTrader Advisory Concierge</p>
        </div>
        """
        resend.Emails.send({
            "from": settings.OTP_FROM_EMAIL,
            "to": "deshpandekrish23@gmail.com",
            "subject": f"🚨 [TorqueTrader Lead] New Consultation: {booking.client_name} - {booking.tier_title}",
            "html": html_content,
        })
    except Exception as exc:
        logger.error("Failed to send founder consultation alert email: %s", exc)


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
def book_consultation(
    payload: ConsultationBookingRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Save consultation booking to database, trigger notification, and return confirmation."""
    booking_ref = f"TT-CONSULT-{int(datetime.now(timezone.utc).timestamp())}"
    
    booking = ConsultationBooking(
        booking_ref=booking_ref,
        client_name=payload.client_name,
        client_email=payload.client_email,
        client_phone=payload.client_phone,
        tier_id=payload.tier_id,
        tier_title=payload.tier_title,
        tier_price=payload.tier_price,
        budget_range=payload.budget_range,
        target_vehicle=payload.target_vehicle,
        notes=payload.notes,
        status="pending",
        payment_status="pending"
    )

    try:
        db.add(booking)
        db.commit()
        db.refresh(booking)
        _send_founder_alert(booking)
    except Exception as db_err:
        logger.error("Error persisting consultation booking: %s", db_err)
        db.rollback()

    return {
        "success": True,
        "booking_id": booking_ref,
        "client_name": payload.client_name,
        "tier_title": payload.tier_title,
        "tier_price": payload.tier_price,
        "message": f"Consultation request confirmed. Our lead automotive consultant will reach out on WhatsApp/Email ({payload.client_phone}) within 2 hours to confirm your session slot.",
    }


@router.get(
    "/consultations",
    summary="List all consultation bookings for Dashboard",
)
def list_consultations(
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieve all consultation leads ordered by newest first."""
    bookings = db.query(ConsultationBooking).order_by(ConsultationBooking.created_at.desc()).all()
    return [
        {
            "id": b.id,
            "booking_ref": b.booking_ref,
            "client_name": b.client_name,
            "client_email": b.client_email,
            "client_phone": b.client_phone,
            "tier_id": b.tier_id,
            "tier_title": b.tier_title,
            "tier_price": b.tier_price,
            "budget_range": b.budget_range,
            "target_vehicle": b.target_vehicle,
            "notes": b.notes,
            "status": b.status,
            "payment_status": b.payment_status,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in bookings
    ]
