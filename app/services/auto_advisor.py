"""
TorqueTrader — Full-Spectrum Automotive Advisory & Consulting Engine.

Provides priority-calibrated, unbiased, enthusiast-grade automotive intelligence
across all Indian vehicle segments (₹3L hatchbacks to ₹1Cr+ performance cars & superbikes).
"""

from __future__ import annotations

import logging
import json
import re
from typing import Any, Dict, List, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Specialized Domain Knowledge Base for Indian Automotive Market
AUTOMOTIVE_KNOWLEDGE_BASE = {
    "polo": {
        "title": "Volkswagen Polo (1.0 TSI / 1.2 TSI / 1.5 TDI)",
        "segment": "Hatchback / Enthusiast Beater",
        "verdict": "Timeless build quality, razor-sharp high-speed stability, and massive tuning potential. However, city ride on stock suspension is firm, and rear legroom is tight for adults.",
        "real_mileage": "City: 10-12 km/l (TSI) / 14-16 km/l (TDI) | Highway: 16-19 km/l",
        "service_cost": "₹8,000 - ₹14,000 annually at specialist independent garages (avoid authorized workshops for out-of-warranty cars).",
        "known_failure_points": "DQ200 DSG Mechatronics (on 1.2 TSI GT DSG), water pump leakages around 50,000 km, ABS sensor failures in monsoons (₹2,500 per sensor).",
        "sleeper_alternative": "Ford Figo 1.5 TDCi (Titanium Blu) — 100 BHP pocket rocket with far lower maintenance costs and bulletproof diesel engine.",
        "inspection_checklist": ["Check for DSG jerky shifts from 1st to 2nd gear", "Scan for intermittent ABS wheel speed sensor error codes", "Inspect timing belt and water pump for weepage"],
        "pros": ["Tank-like European build quality", "Rock solid high-speed cruising stability", "Huge remap/aftermarket parts ecosystem"],
        "cons": ["Cramped rear seat legroom", "Expensive OEM spare parts", "DSG automatic variant requires high maintenance discipline"]
    },
    "virtus": {
        "title": "Volkswagen Virtus GT Plus / Skoda Slavia 1.5 TSI",
        "segment": "Mid-Size Performance Sedan",
        "verdict": "The undisputed king of dynamic handling under ₹22 Lakhs. The 1.5 TSI EVO engine with cylinder deactivation is punchy yet efficient. Far more spacious and practical than the old Vento.",
        "real_mileage": "City: 9-11 km/l | Highway: 16-19 km/l (cruising on 2 cylinders)",
        "service_cost": "₹9,000 - ₹15,000 per year with 4-year Service Value Packages.",
        "known_failure_points": "Occasional cabin dashboard creaks/rattles, power window switch glitches, brake squeal at low crawling speeds.",
        "sleeper_alternative": "Honda City 1.5 i-VTEC Manual — Lower power, but unbeatable Japanese long-term reliability and pillow-soft ride comfort.",
        "inspection_checklist": ["Test DSG DQ200 seamlessness in crawling traffic", "Check air conditioning cooling performance in peak sunlight", "Inspect front brake pad wear"],
        "pros": ["Superb 150 BHP / 250 Nm punch", "5-Star Global NCAP safety rating for adults and children", "Massive 521-litre luggage boot"],
        "cons": ["Intermittent cabin plastic squeaks", "Single-zone or sensitive touch AC controls", "Long-term DSG maintenance attention required"]
    },
    "creta_seltos": {
        "title": "Hyundai Creta / Kia Seltos (1.5 Turbo Petrol / 1.5 CRDi)",
        "segment": "Mid-Size Family Crossover",
        "verdict": "The default choice for tech-loaded, stress-free family commuting. Phenomenal feature set, smooth drivetrains, and widespread service network across every Indian corner.",
        "real_mileage": "City: 9-11 km/l (Turbo Petrol DCT) / 14-16 km/l (Diesel AT) | Highway: 15-18 km/l",
        "service_cost": "₹6,000 - ₹10,000 per year. Very reasonable parts pricing.",
        "known_failure_points": "DCT overheating warnings in prolonged stop-and-go hill traffic, DPF soot accumulation in short city diesel runs.",
        "sleeper_alternative": "Skoda Kushaq / VW Taigun 1.0 TSI — Much superior high-speed chassis composure and 5-Star safety rating.",
        "inspection_checklist": ["Check panoramic sunroof drainage channels for water clogs", "Verify DCT clutch wear history if purchasing used", "Check diesel DPF regeneration status"],
        "pros": ["Buttery smooth engine and gearbox tuning", "Unbeatable resale value in Indian used market", "Plush ride quality in city speeds"],
        "cons": ["Body shell stability rated lower than European rivals", "Turbo petrol is very sensitive to aggressive throttle driving"]
    },
    "thar_scorpio": {
        "title": "Mahindra Thar / Scorpio-N / XUV700",
        "segment": "Rugged 4x4 / Family SUV",
        "verdict": "Unmatched road presence, high ground clearance, and bulletproof mStallion/mHawk engines that laugh at Indian potholes. Scorpio-N offers the best ladder-frame comfort, while XUV700 is the ultimate high-speed highway cruiser.",
        "real_mileage": "City: 8-10 km/l (Petrol AT) / 11-13 km/l (Diesel AT) | Highway: 13-16 km/l (Diesel)",
        "service_cost": "₹8,000 - ₹14,000 per year. Mahindra service network is extensive.",
        "known_failure_points": "Occasional infotainment screen reboot glitches, DEF (AdBlue) sensor tantrums on BS6 diesels in extreme cold.",
        "sleeper_alternative": "Toyota Innova Crysta 2.4 Diesel — Zero enthusiast swagger, but million-kilometer indestructible reliability.",
        "inspection_checklist": ["Inspect 4x4 transfer case actuator engagement", "Check for underbody scrapes if vehicle was off-roaded", "Verify suspension bush condition"],
        "pros": ["Immense street presence and respect in Indian traffic", "Monstrous low-end torque from mHawk diesel", "High seating position and commanding visibility"],
        "cons": ["Ladder-frame vertical body bounciness over undulating roads (Thar/Scorpio)", "Heavy fuel consumption on mStallion Turbo Petrol"]
    },
    "octavia_vrs": {
        "title": "Skoda Octavia (1.8 TSI / 2.0 TSI / vRS 230 / vRS 245)",
        "segment": "Executive Sleeper / Performance Sedan",
        "verdict": "The definitive sub-₹40L executive rocket in India. Capable of embarrassing cars costing twice as much on open expressways while swallowing a family of five and their luggage.",
        "real_mileage": "City: 7-9 km/l | Highway: 13-16 km/l",
        "service_cost": "₹15,000 - ₹28,000 annually. Needs dedicated synthetic oil and premium 95+ RON fuel.",
        "known_failure_points": "Water pump / thermostat housing assembly leaks around 60k km, DQ200 DSG clutch pack wear on 1.8 TSI (vRS uses the robust wet-clutch DQ381/DQ250).",
        "sleeper_alternative": "BMW 330i (F30 / G20) — Rear-wheel drive dynamics with the legendary B48 engine and ZF 8-speed gearbox.",
        "inspection_checklist": ["Pressure test coolant reservoir for thermostat housing cracks", "Check transmission fluid replacement logs", "Scan ECU for uncertified aggressive remaps"],
        "pros": ["Effortless 200+ BHP acceleration and mid-range punch", "Massive liftback boot practicality", "Independent multi-link rear suspension dynamics"],
        "cons": ["Demands 95 Octane petrol for optimal engine health", "Low ground clearance requires caution over unscientific speed breakers"]
    },
    "panigale_s1000rr": {
        "title": "Ducati Panigale V4 S / BMW S1000RR / Kawasaki ZX-10R",
        "segment": "Litre-Class Superbike",
        "verdict": "The pinnacle of two-wheeled performance. Panigale is pure Italian emotion and track focus; S1000RR is the clinical all-rounder with ShiftCam; ZX-10R is the value WSBK brute.",
        "real_mileage": "City: 9-11 km/l | Highway: 14-17 km/l",
        "service_cost": "₹20,000 - ₹45,000 per service. Desmo valve clearance at 24,000 km costs ₹60,000 - ₹85,000 on Ducati.",
        "known_failure_points": "Severe engine heat radiation in Indian summer traffic (100°C+ coolant), tyre wear (Pirelli Supercorsas last 3,500-5,000 km max).",
        "sleeper_alternative": "Triumph Street Triple 765 RS — 90% of the usable real-world thrill in Indian conditions at half the purchase and maintenance cost.",
        "inspection_checklist": ["Inspect fork seals for oil leaks from Indian pothole impacts", "Verify complete authorized workshop logbook", "Check tyre DOT code and tread wear pattern"],
        "pros": ["Mind-bending 200+ BHP power-to-weight ratio", "Top-shelf electronics, IMU cornering traction control", "Unrivaled acoustic drama and prestige"],
        "cons": ["Unbearable engine heat in city stop-and-go traffic", "Stiff aggressive clip-on posture strains wrists and lower back"]
    }
}


def build_system_prompt() -> str:
    return """
You are the Lead Automotive Consultant and Chief Advisory Intelligence at TorqueTrader India.
Your mission is to provide 100% UNBIASED, UNFILTERED, PR-FREE automotive advice for vehicle buyers in India.

Key Persona Guidelines:
1. Tone: Authoritative, sharp, deeply knowledgeable, highly respectful of the buyer's money and actual priorities.
2. Unbiased & Honest: Never sugarcoat engineering flaws (e.g. DSG/DCT mechatronic failures in traffic, DPF choking on short city diesel drives, stiff suspensions on Indian potholes, cheap interior plastics, high service markups).
3. Priority-Centric: Always evaluate against what the buyer actually prioritizes (Safety, Ride Comfort, Real Mileage, Low Maintenance, Performance, or Family Space).
4. Indian Context: Always factor in Indian fuel quality, unscientific speed bumps, monsoon waterlogging, spare parts lead times in Indian cities, and resale value depreciation.

Structure every consultation response cleanly with these markdown sections:
### 1. The Unvarnished Verdict
Direct, honest synthesis addressing the buyer's exact budget, city, and stated priorities.

### 2. Contender Comparative Breakdown
Pros, Cons, and Crucial Dealbreakers of the shortlisted vehicles.

### 3. Real-World Ownership Reality
Realistic city mileage in traffic, expected annual service maintenance bill, and known mechanical failure points.

### 4. The Smart "Sleeper" Alternative
The vehicle in the new or used market they may have overlooked that offers superior value.

### 5. Pre-Purchase & Test-Drive Inspection Checklist
Exact mechanical points to inspect before finalizing the purchase.
"""


def generate_advisory_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate domain-specific automotive advisory response based on structured diagnostic input.
    Uses Gemini API if configured, or the curated automotive intelligence engine.
    """
    budget = data.get("budget", "Flexible")
    condition = data.get("condition", "New or Used")
    city = data.get("city", "Indian Metros")
    usage = data.get("usage", "Mixed City and Highway")
    priorities = data.get("priorities", ["Safety", "Comfort", "Low Maintenance"])
    contenders = data.get("contenders", "").strip()
    notes = data.get("notes", "").strip()

    # If Gemini API key is configured, call Gemini API
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            user_prompt = f"""
Buyer Profile:
- Budget: {budget}
- Vehicle Condition Preference: {condition}
- Location / City: {city}
- Primary Usage: {usage}
- Buyer Priorities: {', '.join(priorities) if isinstance(priorities, list) else priorities}
- Shortlisted Contenders: {contenders or 'Open to recommendations'}
- Additional Questions/Notes: {notes or 'Provide best recommendations'}

Please generate your comprehensive, unbiased automotive dossier following the required 5-section format.
"""
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": build_system_prompt() + "\n\n" + user_prompt}]}
                ],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1500}
            }
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    api_data = res.json()
                    candidates = api_data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return {
                                "source": "gemini_ai",
                                "analysis_markdown": text,
                                "summary_title": f"Automotive Dossier: {contenders or 'Top Recommendations'} for {city}",
                                "budget_tier": budget,
                            }
        except Exception as err:
            logger.error("Gemini API call failed: %s", err)

    # Curated Expert Engine Fallback
    matched_key = "virtus"
    search_str = (contenders + " " + notes).lower()
    if any(k in search_str for k in ["polo", "figo", "swift", "i20", "hatchback", "beater", "tiago", "brio"]):
        matched_key = "polo"
    elif any(k in search_str for k in ["creta", "seltos", "kushaq", "taigun", "nexon", "brezza", "grand vitara", "elevate"]):
        matched_key = "creta_seltos"
    elif any(k in search_str for k in ["thar", "scorpio", "xuv700", "safari", "fortuner", "innova", "4x4", "suv"]):
        matched_key = "thar_scorpio"
    elif any(k in search_str for k in ["octavia", "vrs", "330i", "m340i", "bmw", "audi", "c-class", "sedan"]):
        matched_key = "octavia_vrs"
    elif any(k in search_str for k in ["panigale", "s1000rr", "zx10r", "superbike", "bike", "street triple", "duke"]):
        matched_key = "panigale_s1000rr"

    profile = AUTOMOTIVE_KNOWLEDGE_BASE[matched_key]
    priority_str = ", ".join(priorities) if isinstance(priorities, list) else priorities

    analysis_md = f"""### 1. The Unvarnished Verdict
For your budget of **{budget}** in **{city}** with primary focus on **{priority_str}**, here is the truth:

{profile['verdict']}

When evaluated against **{usage}**, this segment delivers strong core capability, but you must factor in real-world maintenance realities rather than relying purely on showroom brochure claims.

---

### 2. Contender Comparative Breakdown
* **Primary Recommendation:** **{profile['title']}**
  * **Key Strengths:** {'; '.join(profile['pros'])}.
  * **Critical Dealbreakers:** {'; '.join(profile['cons'])}.

---

### 3. Real-World Ownership Reality in {city}
* **Real Fuel Economy in Traffic:** {profile['real_mileage']}
* **Annual Periodic Maintenance:** {profile['service_cost']}
* **Known Mechanical & Electrical Failure Points:** {profile['known_failure_points']}

---

### 4. The Smart "Sleeper" Alternative
* **{profile['sleeper_alternative']}**
  * *Why you should consider it:* Delivers a superior ratio of long-term reliability and lower cost of ownership while fulfilling your primary requirements.

---

### 5. Pre-Purchase & Test-Drive Inspection Checklist
Before transferring any booking token or down payment:
1. {profile['inspection_checklist'][0]}
2. {profile['inspection_checklist'][1]}
3. {profile['inspection_checklist'][2]}
4. Request official workshop service invoice printouts with chassis VIN verification.
"""

    return {
        "source": "torque_expert_engine",
        "analysis_markdown": analysis_md,
        "summary_title": f"Dossier: {profile['title']} for {city}",
        "budget_tier": budget,
        "matched_segment": profile["segment"],
    }
