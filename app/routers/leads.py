from urllib.parse import quote_plus
import fakeredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.lead import RevealPhoneRequest, WhatsappClickRequest
from app.database import get_db
from app.redis_client import get_redis
from app.core.security import get_current_user
from app.models.user import User
from app.models.lead import Lead, InteractionType
from app.models.listing import Listing

router = APIRouter(prefix="/leads", tags=["Leads"])

def enforce_lead_rate_limit(user_id: int, redis: fakeredis.FakeRedis):
    key = f"lead_limit:{user_id}"
    count = redis.get(key)
    if count and int(count) >= 15:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You have reached the limit of lead requests for this period."
        )
    
    # Increment and set 24h expiration if it's the first one
    redis.incr(key)
    if not count:
        redis.expire(key, 24 * 60 * 60)

@router.post("/reveal-phone")
def reveal_phone(
    request: RevealPhoneRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: fakeredis.FakeRedis = Depends(get_redis)
):
    enforce_lead_rate_limit(current_user.id, redis)
    
    # Log interaction
    lead = Lead(buyer_id=current_user.id, listing_id=request.listing_id, interaction_type=InteractionType.phone_reveal)
    db.add(lead)
    db.commit()
    
    listing = db.query(Listing).filter(Listing.id == request.listing_id).first()
    seller_phone = None
    seller_name = "Seller"
    if listing and listing.seller:
        seller_phone = listing.seller.phone_number
        first = listing.seller.first_name or ""
        last = listing.seller.last_name or ""
        seller_name = f"{first} {last}".strip() or "Seller"
    elif listing:
        seller = db.query(User).filter(User.id == listing.seller_id).first()
        if seller and seller.phone_number:
            seller_phone = seller.phone_number

    if not seller_phone:
        seller_phone = "+91 80808 57485"
    
    return {
        "message": "Phone number revealed",
        "phone": seller_phone,
        "phone_number": seller_phone,
        "seller_name": seller_name,
    }

@router.post("/whatsapp-click")
def whatsapp_click(
    request: WhatsappClickRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: fakeredis.FakeRedis = Depends(get_redis)
):
    enforce_lead_rate_limit(current_user.id, redis)
    
    # Log interaction
    lead = Lead(buyer_id=current_user.id, listing_id=request.listing_id, interaction_type=InteractionType.whatsapp_click)
    db.add(lead)
    db.commit()
    
    listing = db.query(Listing).filter(Listing.id == request.listing_id).first()
    seller_phone = None
    bike_title = "motorcycle"
    if listing:
        bike_title = f"{listing.year} {listing.make} {listing.model}"
        if listing.seller and listing.seller.phone_number:
            seller_phone = listing.seller.phone_number
        else:
            seller = db.query(User).filter(User.id == listing.seller_id).first()
            if seller and seller.phone_number:
                seller_phone = seller.phone_number

    if not seller_phone:
        seller_phone = "+91 80808 57485"

    clean_digits = "".join(filter(str.isdigit, seller_phone))
    if len(clean_digits) == 10:
        clean_digits = f"91{clean_digits}"

    msg = f"Hello, I am inquiring about the {bike_title} listed on TorqueTrader (ID: #{request.listing_id}). Is this motorcycle still available for inspection?"
    encoded_msg = quote_plus(msg)
    whatsapp_url = f"https://wa.me/{clean_digits}?text={encoded_msg}"
    
    return {
        "message": "Redirecting to WhatsApp",
        "url": whatsapp_url,
        "phone": seller_phone,
        "phone_number": seller_phone,
    }
