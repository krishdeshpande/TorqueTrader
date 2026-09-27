"""
TorqueTrader — User Feedback & Platform Improvement Router.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import resend

from app.database import get_db
from app.config import settings
from app.models.feedback import Feedback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackCreateRequest(BaseModel):
    name: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    category: str = Field(default="General Suggestion")
    rating: Optional[int] = Field(default=5, ge=1, le=5)
    message: str = Field(..., min_length=3)
    page_url: Optional[str] = Field(default=None)


def _send_feedback_email(feedback: Feedback):
    """Send real-time alert email to founder when user submits feedback."""
    if not settings.RESEND_API_KEY:
        logger.info("[FEEDBACK ALERT] New feedback from %s (%s): %s", feedback.name or "Anonymous", feedback.category, feedback.message)
        return

    try:
        resend.api_key = settings.RESEND_API_KEY
        from_email = settings.OTP_FROM_EMAIL or "onboarding@resend.dev"

        html_body = f"""
        <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px;">
            <div style="background: #111827; color: #FFFFFF; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px;">New User Feedback Received!</h2>
            </div>
            <p><strong>Category:</strong> {feedback.category}</p>
            <p><strong>Rating:</strong> {'⭐' * (feedback.rating or 5)} ({feedback.rating or 5}/5)</p>
            <p><strong>User Name:</strong> {feedback.name or 'Anonymous'}</p>
            <p><strong>Email:</strong> {feedback.email or 'Not provided'}</p>
            <p><strong>Phone:</strong> {feedback.phone or 'Not provided'}</p>
            <p><strong>Submitted From:</strong> <a href="{feedback.page_url or 'https://www.torquetrader.in'}">{feedback.page_url or 'TorqueTrader'}</a></p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
            <p style="font-size: 15px; line-height: 1.6; color: #111827; background: #F9FAFB; padding: 16px; border-radius: 6px; border-left: 4px solid #B91C1C;">
                "{feedback.message}"
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 13px; color: #6B7280;">TorqueTrader Platform Improvement Engine</p>
        </div>
        """

        try:
            resend.Emails.send({
                "from": f"TorqueTrader <{from_email}>",
                "to": [settings.FOUNDER_EMAIL],
                "subject": f"💬 [Feedback] {feedback.category} from {feedback.name or 'A User'}",
                "html": html_body,
            })
            logger.info("Feedback email sent to founder (%s).", settings.FOUNDER_EMAIL)
        except Exception as exc1:
            # Fallback to sandbox sender
            resend.Emails.send({
                "from": "TorqueTrader <onboarding@resend.dev>",
                "to": [settings.FOUNDER_EMAIL],
                "subject": f"💬 [Feedback] {feedback.category} from {feedback.name or 'A User'}",
                "html": html_body,
            })
    except Exception as exc:
        logger.error("Failed to send feedback email: %s", exc)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Submit user feedback or improvement suggestion",
)
def submit_feedback(
    payload: FeedbackCreateRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Store feedback in PostgreSQL and email the founder."""
    feedback = Feedback(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        category=payload.category,
        rating=payload.rating,
        message=payload.message,
        page_url=payload.page_url,
    )

    try:
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        _send_feedback_email(feedback)
    except Exception as db_err:
        logger.error("Failed to save feedback to DB: %s", db_err)
        db.rollback()

    return {
        "success": True,
        "message": "Thank you for your feedback! It has been forwarded directly to our founding team.",
    }
