import fakeredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.lead import RevealPhoneRequest, WhatsappClickRequest
from app.database import get_db
from app.redis_client import get_redis
from app.core.security import get_current_user, RoleChecker
from app.models.user import UserRole, User
from app.models.lead import Lead, InteractionType

router = APIRouter(prefix="/leads", tags=["Leads"])

def enforce_lead_rate_limit(user_id: int, redis: fakeredis.FakeRedis):
    key = f"lead_limit:{user_id}"
    count = redis.get(key)
    if count and int(count) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You have reached the limit of 5 lead requests per 24 hours."
        )
    
    # Increment and set 24h expiration if it's the first one
    redis.incr(key)
    if not count:
        redis.expire(key, 24 * 60 * 60)

@router.post("/reveal-phone")
def reveal_phone(
    request: RevealPhoneRequest,
    current_user: User = Depends(RoleChecker([UserRole.buyer])),
    db: Session = Depends(get_db),
    redis: fakeredis.FakeRedis = Depends(get_redis)
):
    enforce_lead_rate_limit(current_user.id, redis)
    
    # Log interaction
    lead = Lead(buyer_id=current_user.id, listing_id=request.listing_id, interaction_type=InteractionType.phone_reveal)
    db.add(lead)
    db.commit()
    
    # Mock return
    return {"message": "Phone number revealed", "phone": "+1234567890"}

@router.post("/whatsapp-click")
def whatsapp_click(
    request: WhatsappClickRequest,
    current_user: User = Depends(RoleChecker([UserRole.buyer])),
    db: Session = Depends(get_db),
    redis: fakeredis.FakeRedis = Depends(get_redis)
):
    enforce_lead_rate_limit(current_user.id, redis)
    
    # Log interaction
    lead = Lead(buyer_id=current_user.id, listing_id=request.listing_id, interaction_type=InteractionType.whatsapp_click)
    db.add(lead)
    db.commit()
    
    # Mock return
    return {"message": "Redirecting to WhatsApp", "url": f"https://wa.me/1234567890?text=Hi+regarding+listing+{request.listing_id}"}
