"""
TorqueTrader — Group Car & Insurance Buying REST API Router.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.config import settings
from app.core.security import get_current_user, get_current_user_optional, require_admin
from app.models.user import User, UserRole
from app.models.group_buying import (
    VehicleCatalog,
    DealerOrganization,
    BuyerGroup,
    GroupMembership,
    QuotationRequest,
    DealerQuotation,
    QuotationRevision,
    BuyerOfferResponse,
    GroupStatus,
    QuotationStatus,
)
from app.schemas.group_buying import (
    CatalogItemSchema,
    GroupCreateRequest,
    GroupJoinRequest,
    GroupSummarySchema,
    GroupDetailSchema,
    GroupMemberSummary,
    DealerRegisterRequest,
    DealerQuoteSubmitRequest,
    DealerQuotationSchema,
    BuyerOfferDecisionRequest,
    AdminMetricsResponse,
)
from app.services.group_buying_service import ensure_seed_data, calculate_group_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/group-buying", tags=["Group Car & Insurance Buying"])


# ── Catalog & Discovery ────────────────────────────────────────────────────────

@router.get("/catalog", response_model=List[CatalogItemSchema])
def get_catalog(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List available car/motorcycle models and variants for group pooling."""
    ensure_seed_data(db)
    query = db.query(VehicleCatalog)
    if category:
        query = query.filter(VehicleCatalog.category.ilike(f"%{category}%"))
    return query.order_by(VehicleCatalog.is_popular.desc(), VehicleCatalog.id.asc()).all()


@router.get("/groups", response_model=List[GroupSummarySchema])
def list_groups(
    group_type: Optional[str] = None,
    city: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """List active buyer groups with demand and savings metrics."""
    ensure_seed_data(db)
    query = db.query(BuyerGroup)

    if group_type:
        query = query.filter(BuyerGroup.group_type == group_type)
    if city and city != "All":
        query = query.filter(BuyerGroup.city.ilike(f"%{city}%"))
    if status_filter and status_filter != "All":
        query = query.filter(BuyerGroup.status == status_filter)

    groups = query.order_by(BuyerGroup.created_at.desc()).all()
    user_email = current_user.email if current_user else None

    return [calculate_group_summary(g, db, user_email) for g in groups]


@router.post("/groups", response_model=GroupSummarySchema)
def create_group(
    payload: GroupCreateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Create a new car or insurance buyer pool."""
    group_ref = f"GRP-{payload.city[:3].upper()}-{payload.target_make[:4].upper() if payload.target_make else 'POOL'}-{int(datetime.now(timezone.utc).timestamp())}"
    
    group = BuyerGroup(
        group_ref=group_ref,
        group_type=payload.group_type,
        title=payload.title,
        city=payload.city,
        target_make=payload.target_make,
        target_model=payload.target_model,
        target_variant=payload.target_variant,
        fuel_type=payload.fuel_type,
        transmission=payload.transmission,
        target_insurer=payload.target_insurer,
        target_members=payload.target_members,
        default_addons=payload.default_addons,
        status="forming",
        created_by_user_id=current_user.id if current_user else None,
        notes=payload.notes,
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    return calculate_group_summary(group, db, current_user.email if current_user else None)


@router.get("/groups/{group_id}", response_model=GroupDetailSchema)
def get_group_detail(
    group_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieve full group detail, member rosters, and side-by-side quotations."""
    ensure_seed_data(db)
    group = db.query(BuyerGroup).filter(BuyerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Buyer group not found.")

    user_email = current_user.email if current_user else None
    summary = calculate_group_summary(group, db, user_email)

    # Fetch active members
    members = db.query(GroupMembership).filter(
        GroupMembership.group_id == group.id,
        GroupMembership.status == "active",
    ).order_by(GroupMembership.joined_at.asc()).all()

    # Quotations:
    # If group has released quotes (status in offers_available, decision_in_progress, closed) OR user is admin, show all quotes.
    # Otherwise, sealed quotes remain hidden until released.
    is_admin = current_user and current_user.role == UserRole.admin
    quotes_visible = is_admin or group.status in ["offers_available", "decision_in_progress", "closed"]

    quotations_list = []
    if quotes_visible:
        db_quotes = db.query(DealerQuotation).filter(
            DealerQuotation.group_id == group.id,
            DealerQuotation.status.in_(["submitted", "accepted"]),
        ).order_by(DealerQuotation.final_net_on_road.asc()).all()

        for q in db_quotes:
            dealer = q.dealer
            quotations_list.append(DealerQuotationSchema(
                id=q.id,
                dealer_name=dealer.name if dealer else "Authorized Dealer",
                dealer_type=dealer.dealer_type if dealer else "car_dealership",
                dealer_id=q.dealer_id,
                version=q.version,
                ex_showroom_price=q.ex_showroom_price,
                rto_road_tax=q.rto_road_tax,
                insurance_rate_standard=q.insurance_rate_standard,
                insurance_rate_group=q.insurance_rate_group,
                mandatory_charges=q.mandatory_charges,
                standard_accessories=q.standard_accessories,
                group_cash_discount=q.group_cash_discount,
                corporate_exchange_bonus=q.corporate_exchange_bonus,
                final_net_on_road=q.final_net_on_road,
                total_group_discount=q.total_group_discount,
                additional_perks=q.additional_perks or [],
                validity_date=q.validity_date,
                delivery_timeline_weeks=q.delivery_timeline_weeks,
                booking_amount=q.booking_amount,
                conditions=q.conditions,
                is_best_offer=q.is_best_offer,
                submitted_at=q.submitted_at,
            ))

    return GroupDetailSchema(
        **summary,
        default_addons=group.default_addons or [],
        notes=group.notes,
        members=[GroupMemberSummary.model_validate(m) for m in members],
        quotations=quotations_list,
    )


# ── Buyer Group Membership ───────────────────────────────────────────────────

@router.post("/groups/{group_id}/join")
def join_group(
    group_id: int,
    payload: GroupJoinRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Join an active buyer group. Prevents duplicate email membership."""
    group = db.query(BuyerGroup).filter(BuyerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Buyer group not found.")

    if group.status in ["closed", "cancelled"]:
        raise HTTPException(status_code=400, detail="This buyer group is no longer accepting new members.")

    email_clean = payload.buyer_email.strip().lower()

    # Check for duplicate
    existing = db.query(GroupMembership).filter(
        GroupMembership.group_id == group.id,
        GroupMembership.buyer_email == email_clean,
        GroupMembership.status == "active",
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You are already an active member of this buyer group.")

    membership = GroupMembership(
        group_id=group.id,
        user_id=current_user.id if current_user else None,
        buyer_name=payload.buyer_name,
        buyer_email=email_clean,
        buyer_phone=payload.buyer_phone,
        selected_color=payload.selected_color,
        pool_group_insurance=payload.pool_group_insurance,
        custom_addons=payload.custom_addons if payload.custom_addons else group.default_addons,
        purchase_timeline=payload.purchase_timeline,
        purchase_readiness=payload.purchase_readiness,
        current_ncb=payload.current_ncb,
        status="active",
    )
    db.add(membership)
    db.commit()

    # Check if threshold reached
    active_count = db.query(GroupMembership).filter(
        GroupMembership.group_id == group.id,
        GroupMembership.status == "active",
    ).count()

    if active_count >= group.target_members and group.status == "forming":
        group.status = "target_reached"
        db.commit()

    return {
        "status": "success",
        "message": f"Successfully joined {group.title}! You are member #{active_count}.",
        "group_id": group.id,
        "member_count": active_count,
        "target_reached": active_count >= group.target_members,
    }


@router.post("/groups/{group_id}/leave")
def leave_group(
    group_id: int,
    email: str = Query(...),
    db: Session = Depends(get_db),
):
    """Withdraw from a buyer group."""
    email_clean = email.strip().lower()
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.buyer_email == email_clean,
        GroupMembership.status == "active",
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="Active membership not found.")

    membership.status = "withdrawn"
    db.commit()

    return {"status": "success", "message": "You have safely withdrawn from the group."}


# ── Dealer Management & Sealed Quotations ────────────────────────────────────

@router.post("/dealers/register")
def register_dealer(
    payload: DealerRegisterRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Register a dealership or insurance brokerage account for verification."""
    existing = db.query(DealerOrganization).filter(DealerOrganization.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A dealership with this email already exists.")

    dealer = DealerOrganization(
        user_id=current_user.id if current_user else None,
        dealer_type=payload.dealer_type,
        name=payload.name,
        brands_authorized=payload.brands_authorized,
        cities_covered=payload.cities_covered,
        contact_person=payload.contact_person,
        email=payload.email.strip().lower(),
        phone=payload.phone,
        gstin=payload.gstin,
        showroom_address=payload.showroom_address,
        verification_status="verified" if settings.ENVIRONMENT == "development" else "pending",
        verified_at=datetime.now(timezone.utc) if settings.ENVIRONMENT == "development" else None,
    )
    db.add(dealer)
    db.commit()
    db.refresh(dealer)

    return {
        "status": "success",
        "message": "Dealership registration submitted. Awaiting platform verification.",
        "dealer_id": dealer.id,
        "verification_status": dealer.verification_status,
    }


@router.get("/dealer/eligible-groups")
def get_dealer_eligible_groups(
    dealer_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns groups eligible for quotation by this dealership.
    SEALED BID SECURITY: Competing dealers cannot see each other's quotes!
    """
    dealer = db.query(DealerOrganization).filter(DealerOrganization.id == dealer_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer organization not found.")

    # Find groups matching city or brand
    groups = db.query(BuyerGroup).filter(
        BuyerGroup.status.in_(["collecting_quotes", "offers_available", "target_reached"])
    ).all()

    results = []
    for g in groups:
        # Check if this dealer already submitted a quote
        my_quote = db.query(DealerQuotation).filter(
            DealerQuotation.group_id == g.id,
            DealerQuotation.dealer_id == dealer.id,
        ).first()

        members_count = db.query(GroupMembership).filter(
            GroupMembership.group_id == g.id,
            GroupMembership.status == "active",
        ).count()

        results.append({
            "group_id": g.id,
            "group_ref": g.group_ref,
            "title": g.title,
            "city": g.city,
            "group_type": g.group_type,
            "target_make": g.target_make,
            "target_model": g.target_model,
            "target_variant": g.target_variant,
            "target_members": g.target_members,
            "active_members": members_count,
            "status": g.status,
            "has_submitted_quote": my_quote is not None,
            "my_quote_net_on_road": my_quote.final_net_on_road if my_quote else None,
        })

    return results


@router.post("/dealer/submit-quote")
def submit_dealer_quotation(
    dealer_id: int,
    payload: DealerQuoteSubmitRequest,
    db: Session = Depends(get_db),
):
    """
    Submit or revise a sealed quotation for an active buyer group.
    Mathematical validation enforces: Net On-Road = Ex-Showroom + RTO + Group Insurance + Mandatory - Discounts.
    """
    dealer = db.query(DealerOrganization).filter(DealerOrganization.id == dealer_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer not found.")

    group = db.query(BuyerGroup).filter(BuyerGroup.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Buyer group not found.")

    # Compute expected on-road price
    gross = (
        payload.ex_showroom_price
        + payload.rto_road_tax
        + payload.insurance_rate_group
        + payload.mandatory_charges
        + payload.standard_accessories
    )
    total_discounts = payload.group_cash_discount + payload.corporate_exchange_bonus
    net_on_road = max(0.0, gross - total_discounts)

    # Compute retail benchmark comparison
    retail_gross = (
        payload.ex_showroom_price
        + payload.rto_road_tax
        + payload.insurance_rate_standard
        + payload.mandatory_charges
        + payload.standard_accessories
    )
    savings = max(0.0, retail_gross - net_on_road)

    # Check for existing quote to revise
    existing = db.query(DealerQuotation).filter(
        DealerQuotation.group_id == group.id,
        DealerQuotation.dealer_id == dealer.id,
    ).first()

    if existing:
        # Create revision audit entry
        rev = QuotationRevision(
            quotation_id=existing.id,
            revision_number=existing.version,
            final_net_on_road=existing.final_net_on_road,
            total_group_discount=existing.total_group_discount,
            change_summary=f"Revised from ₹{existing.final_net_on_road:,.0f} to ₹{net_on_road:,.0f}",
        )
        db.add(rev)

        # Update existing quote
        existing.version += 1
        existing.ex_showroom_price = payload.ex_showroom_price
        existing.rto_road_tax = payload.rto_road_tax
        existing.insurance_rate_standard = payload.insurance_rate_standard
        existing.insurance_rate_group = payload.insurance_rate_group
        existing.mandatory_charges = payload.mandatory_charges
        existing.standard_accessories = payload.standard_accessories
        existing.group_cash_discount = payload.group_cash_discount
        existing.corporate_exchange_bonus = payload.corporate_exchange_bonus
        existing.final_net_on_road = net_on_road
        existing.total_group_discount = savings
        existing.additional_perks = payload.additional_perks
        existing.validity_date = payload.validity_date
        existing.delivery_timeline_weeks = payload.delivery_timeline_weeks
        existing.booking_amount = payload.booking_amount
        existing.conditions = payload.conditions
        existing.status = "revised"
        db.commit()
        db.refresh(existing)
        return {
            "status": "success",
            "message": f"Quotation updated to version {existing.version} successfully.",
            "quote_id": existing.id,
            "net_on_road": existing.final_net_on_road,
            "savings": existing.total_group_discount,
        }

    # New quote
    quote = DealerQuotation(
        group_id=group.id,
        dealer_id=dealer.id,
        version=1,
        ex_showroom_price=payload.ex_showroom_price,
        rto_road_tax=payload.rto_road_tax,
        insurance_rate_standard=payload.insurance_rate_standard,
        insurance_rate_group=payload.insurance_rate_group,
        mandatory_charges=payload.mandatory_charges,
        standard_accessories=payload.standard_accessories,
        group_cash_discount=payload.group_cash_discount,
        corporate_exchange_bonus=payload.corporate_exchange_bonus,
        final_net_on_road=net_on_road,
        total_group_discount=savings,
        additional_perks=payload.additional_perks,
        validity_date=payload.validity_date,
        delivery_timeline_weeks=payload.delivery_timeline_weeks,
        booking_amount=payload.booking_amount,
        conditions=payload.conditions,
        status="submitted",
        is_sealed=True,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)

    return {
        "status": "success",
        "message": "Sealed quotation submitted successfully. Awaiting platform deadline.",
        "quote_id": quote.id,
        "net_on_road": quote.final_net_on_road,
        "savings": quote.total_group_discount,
    }


# ── Buyer Decision / Lead Action ─────────────────────────────────────────────

@router.post("/quotes/decision")
def record_buyer_decision(
    payload: BuyerOfferDecisionRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """A buyer accepts an offer, requests dealership callback, or initiates booking."""
    quote = db.query(DealerQuotation).filter(DealerQuotation.id == payload.quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    response = BuyerOfferResponse(
        user_id=current_user.id if current_user else None,
        group_id=payload.group_id,
        quotation_id=quote.id,
        buyer_name=payload.buyer_name,
        buyer_email=payload.buyer_email.strip().lower(),
        buyer_phone=payload.buyer_phone,
        decision=payload.decision,
        preferred_contact_method=payload.preferred_contact_method,
        notes=payload.notes,
    )
    db.add(response)
    db.commit()

    dealer_name = quote.dealer.name if quote.dealer else "the dealership"

    return {
        "status": "success",
        "message": f"Your request has been routed to {dealer_name}! Their sales desk will reach out within 4 business hours.",
        "decision": payload.decision,
    }


# ── Admin Operations & Analytics ─────────────────────────────────────────────

@router.post("/admin/groups/{group_id}/request-quotes")
def admin_request_quotes(
    group_id: int,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Issue quotation request to verified dealers/insurers for this pool."""
    group = db.query(BuyerGroup).filter(BuyerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")

    group.status = "collecting_quotes"
    group.quote_deadline = datetime.now(timezone.utc) + timedelta(days=7)

    # Create quotation request record
    req = QuotationRequest(
        group_id=group.id,
        request_ref=f"REQ-{group.group_ref}-01",
        status="open",
        deadline=group.quote_deadline,
        eligible_dealers_count=3,
    )
    db.add(req)
    db.commit()

    return {"status": "success", "message": f"Quotation request published for {group.title}.", "status_now": group.status}


@router.post("/admin/groups/{group_id}/release-offers")
def admin_release_offers(
    group_id: int,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Unseal submitted dealer quotes and release them for side-by-side buyer comparison."""
    group = db.query(BuyerGroup).filter(BuyerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")

    # Unseal all submitted quotes
    quotes = db.query(DealerQuotation).filter(DealerQuotation.group_id == group.id).all()
    if not quotes:
        raise HTTPException(status_code=400, detail="Cannot release offers: no quotations have been submitted yet.")

    # Find lowest quote and mark as best offer
    lowest_quote = min(quotes, key=lambda q: q.final_net_on_road)
    for q in quotes:
        q.is_sealed = False
        q.is_best_offer = (q.id == lowest_quote.id)

    group.status = "offers_available"
    db.commit()

    return {"status": "success", "message": f"Offers unsealed! {len(quotes)} competitive quotations now visible to buyers.", "best_price": lowest_quote.final_net_on_road}


@router.get("/admin/metrics", response_model=AdminMetricsResponse)
def get_admin_metrics(
    db: Session = Depends(get_db),
):
    """Platform-wide group buying analytics."""
    ensure_seed_data(db)
    active_groups = db.query(BuyerGroup).count()
    ready_buyers = db.query(GroupMembership).filter(GroupMembership.status == "active").count()
    total_dealers = db.query(DealerOrganization).count()
    verified_dealers = db.query(DealerOrganization).filter(DealerOrganization.verification_status == "verified").count()
    total_quotes = db.query(DealerQuotation).count()

    # Calculate average savings
    avg_discount = db.query(func.avg(DealerQuotation.total_group_discount)).scalar() or 290000.0
    total_community_savings = avg_discount * ready_buyers

    return AdminMetricsResponse(
        total_active_groups=active_groups,
        total_ready_buyers=ready_buyers,
        total_dealers_registered=total_dealers,
        total_verified_dealers=verified_dealers,
        total_quotes_submitted=total_quotes,
        average_group_discount_inr=float(avg_discount),
        total_estimated_community_savings_inr=float(total_community_savings),
    )


@router.post("/seed-reset")
def reset_seed_data(
    db: Session = Depends(get_db),
):
    """Reset demonstration groups and seed data."""
    ensure_seed_data(db)
    return {"status": "success", "message": "Demo data ready."}
