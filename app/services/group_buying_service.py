"""
TorqueTrader — Group Buying Service Layer.
Handles business logic, demand aggregation, sealed quotation comparisons,
and Mumbai 20-buyer demonstration scenario seeding.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

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
    GroupCreateRequest,
    GroupJoinRequest,
    DealerQuoteSubmitRequest,
    BuyerOfferDecisionRequest,
)

logger = logging.getLogger(__name__)


def ensure_seed_data(db: Session) -> None:
    """Pre-seed catalog, demo dealerships, and the Mumbai 20-customer Creta group if not present."""
    # 1. Seed Vehicle Catalog
    if db.query(VehicleCatalog).count() == 0:
        catalog_items = [
            VehicleCatalog(
                category="Car / SUV",
                make="Hyundai",
                model="Creta",
                variant="SX(O) Petrol IVT (Automatic)",
                fuel_type="Petrol",
                transmission="Automatic (IVT)",
                approx_ex_showroom=1870000.0,
                approx_on_road=2165000.0,
                is_popular=True,
                image_url="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
            ),
            VehicleCatalog(
                category="Car / SUV",
                make="Skoda",
                model="Slavia",
                variant="1.5 TSI Style DSG",
                fuel_type="Petrol",
                transmission="DSG / DCT",
                approx_ex_showroom=1880000.0,
                approx_on_road=2190000.0,
                is_popular=True,
                image_url="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
            ),
            VehicleCatalog(
                category="Car / SUV",
                make="Mahindra",
                model="XUV700",
                variant="AX7L Diesel AT AWD",
                fuel_type="Diesel",
                transmission="Torque Converter AT",
                approx_ex_showroom=2390000.0,
                approx_on_road=2840000.0,
                is_popular=True,
                image_url="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
            ),
            VehicleCatalog(
                category="Car / SUV",
                make="Tata",
                model="Nexon",
                variant="Fearless Plus S DCA",
                fuel_type="Petrol",
                transmission="DCA / Dual Clutch",
                approx_ex_showroom=1430000.0,
                approx_on_road=1670000.0,
                is_popular=True,
                image_url="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
            ),
            VehicleCatalog(
                category="Motorcycle / Superbike",
                make="Royal Enfield",
                model="Hunter 350",
                variant="Dapper Series Dual-ABS",
                fuel_type="Petrol",
                transmission="Manual",
                approx_ex_showroom=169000.0,
                approx_on_road=199000.0,
                is_popular=True,
                image_url="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
            ),
        ]
        db.add_all(catalog_items)
        db.commit()
        logger.info("Seeded %d vehicle catalog entries.", len(catalog_items))

    # 2. Seed Demonstration Dealerships & Brokers in Mumbai
    if db.query(DealerOrganization).count() == 0:
        demo_dealers = [
            DealerOrganization(
                dealer_type="car_dealership",
                name="Apex Hyundai (South & West Mumbai)",
                brands_authorized=["Hyundai"],
                cities_covered=["Mumbai", "Thane", "Navi Mumbai"],
                contact_person="Rohan Mehta (Fleet Sales Head)",
                email="dealer-apex@torquetrader.demo",
                phone="+91 98200 11221",
                gstin="27AAACH1234F1Z5",
                showroom_address="Worli Seaface & Andheri West, Mumbai",
                verification_status="verified",
                verified_at=datetime.now(timezone.utc),
                is_demo=True,
            ),
            DealerOrganization(
                dealer_type="car_dealership",
                name="Shreenath Hyundai (Western Suburbs)",
                brands_authorized=["Hyundai"],
                cities_covered=["Mumbai", "Thane"],
                contact_person="Kavita Saxena (Institutional Sales)",
                email="dealer-shreenath@torquetrader.demo",
                phone="+91 98200 33442",
                gstin="27BBBCH5678G2Z1",
                showroom_address="S.V. Road, Goregaon West, Mumbai",
                verification_status="verified",
                verified_at=datetime.now(timezone.utc),
                is_demo=True,
            ),
            DealerOrganization(
                dealer_type="car_dealership",
                name="Modi Hyundai (Central Mumbai & Thane)",
                brands_authorized=["Hyundai"],
                cities_covered=["Mumbai", "Navi Mumbai"],
                contact_person="Amit Gokhale (VP Commercial)",
                email="dealer-modi@torquetrader.demo",
                phone="+91 98200 55663",
                gstin="27CCCCH9012H3Z8",
                showroom_address="LBS Marg, Kurla & Thane West",
                verification_status="verified",
                verified_at=datetime.now(timezone.utc),
                is_demo=True,
            ),
            DealerOrganization(
                dealer_type="insurance_broker",
                name="CareShield Direct (HDFC ERGO & Tata AIG Fleet Desk)",
                brands_authorized=["HDFC ERGO", "Tata AIG", "ICICI Lombard"],
                cities_covered=["Mumbai", "Delhi-NCR", "Bangalore"],
                contact_person="Priya Nambiar (Corporate Broker Head)",
                email="insurance-careshield@torquetrader.demo",
                phone="+91 98200 77884",
                gstin="27DDDBR3456K1Z9",
                showroom_address="BKC G-Block, Bandra East, Mumbai",
                verification_status="verified",
                verified_at=datetime.now(timezone.utc),
                is_demo=True,
            ),
        ]
        db.add_all(demo_dealers)
        db.commit()
        logger.info("Seeded %d demo dealerships and insurance brokers.", len(demo_dealers))

    # 3. Seed Core Mumbai 20-Customer Creta Group
    mumbai_group = db.query(BuyerGroup).filter(BuyerGroup.group_ref == "GRP-MUM-CRETA-2026").first()
    if not mumbai_group:
        mumbai_group = BuyerGroup(
            group_ref="GRP-MUM-CRETA-2026",
            group_type="car_purchase",
            title="Mumbai 20-Customer Creta SX(O) Petrol IVT Buyer Group",
            city="Mumbai",
            target_make="Hyundai",
            target_model="Creta",
            target_variant="SX(O) Petrol IVT (Automatic)",
            fuel_type="Petrol",
            transmission="Automatic (IVT)",
            target_insurer="Multi-Insurer Bidding",
            target_members=20,
            status="offers_available",  # Offers ready for side-by-side comparison!
            default_addons=[
                "Zero Depreciation (Bumper-to-Bumper)",
                "Return to Invoice (RTI)",
                "Engine & Gearbox Protection (Water Ingress)",
                "Consumables Cover",
                "24x7 Roadside Assistance",
            ],
            notes="Aggregated demand for 20 verified buyers across Mumbai Metropolitan Region looking for delivery within 30 days.",
            is_demo=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=5),
        )
        db.add(mumbai_group)
        db.commit()
        db.refresh(mumbai_group)

        # Seed 20 realistic Mumbai buyers
        demo_buyers = [
            ("Aarav Shah", "aarav.mumbai@demo.tt", "+91 98201 10001", "Ranger Khaki", True, "Within 15 Days"),
            ("Riya Kulkarni", "riya.k@demo.tt", "+91 98201 10002", "Abyss Black", True, "Within 30 Days"),
            ("Vikram Deshmukh", "vikram.d@demo.tt", "+91 98201 10003", "Atlas White", True, "Immediate"),
            ("Ananya Iyer", "ananya.i@demo.tt", "+91 98201 10004", "Titan Grey", True, "Within 30 Days"),
            ("Karan Malhotra", "karan.m@demo.tt", "+91 98201 10005", "Robust Emerald", False, "Within 30 Days"),
            ("Tanvi Joshi", "tanvi.j@demo.tt", "+91 98201 10006", "Atlas White", True, "Within 15 Days"),
            ("Nikhil Merchant", "nikhil.m@demo.tt", "+91 98201 10007", "Abyss Black", True, "Within 30 Days"),
            ("Pooja Nair", "pooja.n@demo.tt", "+91 98201 10008", "Ranger Khaki", True, "Within 30 Days"),
            ("Siddharth Rao", "sid.rao@demo.tt", "+91 98201 10009", "Titan Grey", True, "Immediate"),
            ("Meera Singhania", "meera.s@demo.tt", "+91 98201 10010", "Atlas White", True, "Within 30 Days"),
            ("Rohan Agarwal", "rohan.a@demo.tt", "+91 98201 10011", "Abyss Black", True, "Within 15 Days"),
            ("Sneha Patil", "sneha.p@demo.tt", "+91 98201 10012", "Ranger Khaki", True, "Within 30 Days"),
            ("Aditya Verma", "aditya.v@demo.tt", "+91 98201 10013", "Atlas White", True, "Within 30 Days"),
            ("Kavita Shetty", "kavita.s@demo.tt", "+91 98201 10014", "Titan Grey", False, "Within 15 Days"),
            ("Rahul Kapadia", "rahul.k@demo.tt", "+91 98201 10015", "Robust Emerald", True, "Within 30 Days"),
            ("Divya Menon", "divya.m@demo.tt", "+91 98201 10016", "Atlas White", True, "Immediate"),
            ("Farhan Qureshi", "farhan.q@demo.tt", "+91 98201 10017", "Abyss Black", True, "Within 30 Days"),
            ("Shweta Hegde", "shweta.h@demo.tt", "+91 98201 10018", "Titan Grey", True, "Within 30 Days"),
            ("Gaurav Bhatia", "gaurav.b@demo.tt", "+91 98201 10019", "Ranger Khaki", True, "Within 15 Days"),
            ("Neha Chawla", "neha.c@demo.tt", "+91 98201 10020", "Atlas White", True, "Within 30 Days"),
        ]

        memberships = []
        for name, email, phone, color, ins_pool, timeline in demo_buyers:
            m = GroupMembership(
                group_id=mumbai_group.id,
                buyer_name=name,
                buyer_email=email,
                buyer_phone=phone,
                selected_color=color,
                pool_group_insurance=ins_pool,
                custom_addons=[
                    "Zero Depreciation (Bumper-to-Bumper)",
                    "Return to Invoice (RTI)",
                    "Engine & Gearbox Protection",
                ],
                purchase_timeline=timeline,
                purchase_readiness="ready_to_buy",
                status="active",
            )
            memberships.append(m)
        db.add_all(memberships)
        db.commit()

        # Seed Quotation Request
        q_req = QuotationRequest(
            group_id=mumbai_group.id,
            request_ref="REQ-MUM-CRETA-2026-01",
            status="closed",
            deadline=datetime.now(timezone.utc) + timedelta(days=7),
            eligible_dealers_count=3,
        )
        db.add(q_req)
        db.commit()
        db.refresh(q_req)

        # Seed 3 Competing Dealership Quotes
        dealers = db.query(DealerOrganization).filter(DealerOrganization.dealer_type == "car_dealership").all()
        if len(dealers) >= 3:
            # Dealer A: Apex Hyundai -> ₹18,90,000 on-road (Retail is ~₹21,65,000)
            quote_a = DealerQuotation(
                quotation_request_id=q_req.id,
                group_id=mumbai_group.id,
                dealer_id=dealers[0].id,
                version=1,
                ex_showroom_price=1870000.0,
                rto_road_tax=224400.0,
                insurance_rate_standard=78000.0,
                insurance_rate_group=44000.0,       # ₹34k insurance savings via pool
                mandatory_charges=3500.0,
                standard_accessories=12000.0,
                group_cash_discount=240000.0,       # ₹2.40L cash group discount
                corporate_exchange_bonus=23900.0,
                final_net_on_road=1890000.0,
                total_group_discount=275000.0,
                additional_perks=[
                    "Free 3-Year Extended Warranty (Total 6 Yrs / 100,000 KM)",
                    "Free Floor Mats, Mudflaps & Boot Mat",
                    "Dedicated Service Concierge for the 20 Group Members",
                ],
                validity_date="Valid for 15 Days",
                delivery_timeline_weeks=2,
                booking_amount=25000.0,
                status="submitted",
                is_sealed=False,
                is_best_offer=False,
            )

            # Dealer B: Shreenath Hyundai -> ₹18,65,000 on-road
            quote_b = DealerQuotation(
                quotation_request_id=q_req.id,
                group_id=mumbai_group.id,
                dealer_id=dealers[1].id,
                version=1,
                ex_showroom_price=1870000.0,
                rto_road_tax=224400.0,
                insurance_rate_standard=78000.0,
                insurance_rate_group=42000.0,
                mandatory_charges=3500.0,
                standard_accessories=15000.0,
                group_cash_discount=265000.0,
                corporate_exchange_bonus=24900.0,
                final_net_on_road=1865000.0,
                total_group_discount=300000.0,
                additional_perks=[
                    "Free 4-Year Maintenance Package (Periodic Oil & Consumables Free)",
                    "Ceramic Coating Treatment voucher (50% off)",
                    "Priority Vehicle Allocation within 14 Days",
                ],
                validity_date="Valid for 15 Days",
                delivery_timeline_weeks=2,
                booking_amount=21000.0,
                status="submitted",
                is_sealed=False,
                is_best_offer=False,
            )

            # Dealer C: Modi Hyundai -> ₹18,50,000 on-road (BEST VALUE)
            quote_c = DealerQuotation(
                quotation_request_id=q_req.id,
                group_id=mumbai_group.id,
                dealer_id=dealers[2].id,
                version=1,
                ex_showroom_price=1870000.0,
                rto_road_tax=224400.0,
                insurance_rate_standard=78000.0,
                insurance_rate_group=39000.0,       # 50% off insurance OD premium
                mandatory_charges=3500.0,
                standard_accessories=18000.0,
                group_cash_discount=280000.0,       # Highest volume discount
                corporate_exchange_bonus=24900.0,
                final_net_on_road=1850000.0,        # ₹18.50L net on-road
                total_group_discount=315000.0,      # ₹3.15L savings per customer!
                additional_perks=[
                    "Lowest Price Match Guarantee across West India",
                    "Free Zero-Depreciation Insurance with Return to Invoice (RTI) Included",
                    "Free Hyundai Genuine Dashcam + High Security Number Plate Home Delivery",
                    "Guaranteed Batch Handover within 10 Days of Loan Disbursal",
                ],
                validity_date="Valid for 15 Days",
                delivery_timeline_weeks=1,
                booking_amount=20000.0,
                status="accepted",
                is_sealed=False,
                is_best_offer=True,
            )
            db.add_all([quote_a, quote_b, quote_c])
            db.commit()

    # 4. Seed Standalone Mumbai Insurance Renewal Pool (HDFC ERGO / Tata AIG)
    ins_group = db.query(BuyerGroup).filter(BuyerGroup.group_ref == "GRP-MUM-INS-RENEW-2026").first()
    if not ins_group:
        ins_group = BuyerGroup(
            group_ref="GRP-MUM-INS-RENEW-2026",
            group_type="insurance_renewal",
            title="Mumbai Annual Motor Insurance Renewal Pool (HDFC ERGO / Tata AIG)",
            city="Mumbai",
            target_make="Multi-Brand (Creta / Slavia / City / Seltos)",
            target_model="1000cc - 1500cc Private Vehicles",
            target_variant="Zero-Depreciation + RTI + Engine Protect",
            target_insurer="HDFC ERGO General Insurance",
            target_members=15,
            status="offers_available",
            default_addons=[
                "Zero Depreciation (Bumper-to-Bumper, Unlimited Claims)",
                "Return to Invoice (RTI)",
                "Engine & Gearbox Protection Cover",
                "Consumables Cover & Key Replacement",
                "NCB Protection Support (Up to 50%)",
            ],
            notes="Bulk group renewal pool for Mumbai car owners renewing in current quarter. Negotiating direct corporate agency fleet discount.",
            is_demo=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=3),
        )
        db.add(ins_group)
        db.commit()
        db.refresh(ins_group)

        # Seed 12 members in insurance pool
        ins_members = [
            ("Suresh Nair", "suresh.nair@demo.tt", "+91 98202 20001", "50%"),
            ("Aditi Sen", "aditi.sen@demo.tt", "+91 98202 20002", "35%"),
            ("Rajesh Pillai", "rajesh.p@demo.tt", "+91 98202 20003", "50%"),
            ("Manish Kapoor", "manish.k@demo.tt", "+91 98202 20004", "20%"),
            ("Zoya Sheikh", "zoya.s@demo.tt", "+91 98202 20005", "50%"),
            ("Deepak Patel", "deepak.p@demo.tt", "+91 98202 20006", "35%"),
            ("Pooja Hegde", "pooja.h@demo.tt", "+91 98202 20007", "50%"),
            ("Sameer Kadam", "sameer.k@demo.tt", "+91 98202 20008", "0%"),
            ("Bhavna Shah", "bhavna.s@demo.tt", "+91 98202 20009", "50%"),
            ("Rohit Chawla", "rohit.c@demo.tt", "+91 98202 20010", "35%"),
            ("Aniket Soni", "aniket.s@demo.tt", "+91 98202 20011", "50%"),
            ("Geeta Menon", "geeta.m@demo.tt", "+91 98202 20012", "50%"),
        ]
        ins_records = []
        for name, email, phone, ncb in ins_members:
            im = GroupMembership(
                group_id=ins_group.id,
                buyer_name=name,
                buyer_email=email,
                buyer_phone=phone,
                pool_group_insurance=True,
                custom_addons=[
                    "Zero Depreciation (Bumper-to-Bumper, Unlimited Claims)",
                    "Return to Invoice (RTI)",
                    "Engine & Gearbox Protection Cover",
                ],
                purchase_timeline="Within 15 Days",
                purchase_readiness="ready_to_buy",
                current_ncb=ncb,
                status="active",
            )
            ins_records.append(im)
        db.add_all(ins_records)
        db.commit()

        # Add broker quote for the insurance pool
        ins_broker = db.query(DealerOrganization).filter(DealerOrganization.dealer_type == "insurance_broker").first()
        if ins_broker:
            q_ins = DealerQuotation(
                group_id=ins_group.id,
                dealer_id=ins_broker.id,
                version=1,
                ex_showroom_price=0.0,
                rto_road_tax=0.0,
                insurance_rate_standard=34500.0,   # Standard retail quote for Zero-Dep
                insurance_rate_group=19800.0,      # Bulk pool discount: ₹19,800
                mandatory_charges=0.0,
                standard_accessories=0.0,
                group_cash_discount=14700.0,
                corporate_exchange_bonus=0.0,
                final_net_on_road=19800.0,
                total_group_discount=14700.0,
                additional_perks=[
                    "Cashless Claims across 6,400+ Authorized Garages in India",
                    "Zero Deductible on Windshield Glass and Plastic Parts",
                    "Spot Survey within 4 Hours anywhere in Mumbai MMR",
                    "Existing No Claim Bonus (NCB) completely carried forward",
                ],
                validity_date="Valid till end of month",
                delivery_timeline_weeks=1,
                booking_amount=0.0,
                status="accepted",
                is_sealed=False,
                is_best_offer=True,
            )
            db.add(q_ins)
            db.commit()

    logger.info("Group buying seed data verification complete.")


def calculate_group_summary(group: BuyerGroup, db: Session, user_email: Optional[str] = None) -> Dict[str, Any]:
    """Helper to compute aggregated statistics and best offers for a group."""
    members_count = db.query(GroupMembership).filter(
        GroupMembership.group_id == group.id,
        GroupMembership.status == "active"
    ).count()

    insurance_pooled = db.query(GroupMembership).filter(
        GroupMembership.group_id == group.id,
        GroupMembership.status == "active",
        GroupMembership.pool_group_insurance == True
    ).count()

    # Find best quote if available
    quotes = db.query(DealerQuotation).filter(
        DealerQuotation.group_id == group.id,
        DealerQuotation.is_sealed == False
    ).order_by(DealerQuotation.final_net_on_road.asc()).all()

    best_quote = quotes[0] if quotes else None

    is_user_member = False
    if user_email:
        is_user_member = db.query(GroupMembership).filter(
            GroupMembership.group_id == group.id,
            GroupMembership.buyer_email == user_email.strip().lower(),
            GroupMembership.status == "active"
        ).first() is not None

    return {
        "id": group.id,
        "group_ref": group.group_ref,
        "group_type": group.group_type,
        "title": group.title,
        "city": group.city,
        "target_make": group.target_make,
        "target_model": group.target_model,
        "target_variant": group.target_variant,
        "fuel_type": group.fuel_type,
        "transmission": group.transmission,
        "target_insurer": group.target_insurer,
        "target_members": group.target_members,
        "member_count": members_count,
        "insurance_pooled_count": insurance_pooled,
        "status": group.status,
        "quote_deadline": group.quote_deadline,
        "created_at": group.created_at,
        "best_quote_on_road": best_quote.final_net_on_road if best_quote else None,
        "max_savings_per_car": best_quote.total_group_discount if best_quote else None,
        "is_user_member": is_user_member,
    }
