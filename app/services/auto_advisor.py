"""
TorqueTrader — Full-Spectrum Automotive Advisory & Intelligence Engine.

Provides deep, priority-calibrated, highly specific automotive intelligence
with concrete vehicle models, real fuel economy figures, exact maintenance budgets,
common failure points, and sleeper alternatives.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


# ── Granular Automotive Recommendation Matrix for India ────────────────────────
SEGMENT_CATALOG: Dict[str, Dict[str, Any]] = {
    "Under ₹6L": {
        "primary_recommendations": [
            {
                "name": "Ford Figo / Freestyle 1.5 TDCi (Diesel)",
                "type": "Used (2018-2021)",
                "why": "The undisputed performance and fuel economy champion under ₹6 Lakhs. 100 BHP / 215 Nm torque from the bulletproof 1.5L TDCi engine, communicative hydraulic-like steering, and strong structural safety.",
                "pros": ["Monstrous low-end and mid-range diesel punch", "Stellar 15-18 km/l in city traffic (22+ km/l on highways)", "Very affordable Ford spare parts availability through child-part strategy"],
                "cons": ["Rear seat legroom is average", "Interior dashboard plastics feel utilitarian", "Ford's official service presence is consolidated"]
            },
            {
                "name": "Volkswagen Polo 1.0 TSI (6-Speed Manual)",
                "type": "Used (2019-2021)",
                "why": "Tank-like European build quality, 110 BHP turbocharged engine, timeless design, and high-speed highway stability that feels planted even at 140+ km/h.",
                "pros": ["Rock-solid sheet metal and high-speed cruising stability", "Huge aftermarket modification and tuning potential", "Excellent front seat ergonomic support"],
                "cons": ["Tight rear legroom for adults", "Stock suspension is firm over sharp urban potholes", "OEM parts at authorized workshops carry higher price tags"]
            },
            {
                "name": "Honda Jazz 1.2 i-VTEC / Honda Brio",
                "type": "Used (2016-2020)",
                "why": "The ultimate stress-free, spacious city hatchback. Legendary Japanese 1.2L 4-cylinder reliability, magic seats with unmatched luggage versatility, and pillow-soft ride comfort.",
                "pros": ["Bulletproof Japanese engine with zero maintenance drama", "Massive backseat legroom and airy greenhouse visibility", "Very light clutch and smooth city gearbox"],
                "cons": ["Lacks low-end punch (needs to be revved past 3,500 RPM)", "Lightweight sheet metal compared to European rivals", "Basic infotainment and speaker quality"]
            }
        ],
        "mileage": "City Traffic: 11-13 km/l (Petrol) / 16-18 km/l (Diesel) | Highway: 17-23 km/l",
        "service_budget": "₹6,000 - ₹11,000 annually at competent independent multi-brand garages.",
        "failure_points": "ABS wheel speed sensors on VWs in heavy monsoon rains (₹2,200/sensor), water pump weepage past 60k km, clutch cable wear on older city hatchbacks.",
        "sleeper": "Fiat Punto Abarth 1.4 T-Jet (145 BHP) or Ford Fiesta 1.5 TDCi Titanium — rare sleeper cars offering sportscar-grade steering feedback under ₹5 Lakhs.",
        "checklist": [
            "Check for blue/black smoke on aggressive diesel cold acceleration (EGR/Turbo condition).",
            "Listen for front suspension bush thuds over sharp speed bumps.",
            "Verify complete service invoice records and check for odometer tampering on OBD scanner.",
            "Inspect tyre wear symmetry and check for underbody rust/corrosion in coastal cities (Mumbai/Chennai)."
        ]
    },
    "₹6L - ₹12L": {
        "primary_recommendations": [
            {
                "name": "Tata Nexon 1.5 Revotorq Diesel / 1.2 Revotron Petrol",
                "type": "New or Pre-Owned (2020-2024)",
                "why": "5-Star Global NCAP certified body shell, 208mm ground clearance that glides over monsoon craters, and a muscular 260 Nm diesel engine.",
                "pros": ["Heavy-duty crash safety and tank-like build", "Exceptional suspension bump absorption on broken roads", "Spacious rear bench with great thigh support"],
                "cons": ["AMT automatic is jerky (opt for Manual)", "Infotainment software has occasional minor bugs", "Tata dealership service consistency varies"]
            },
            {
                "name": "Honda City 1.5 i-VTEC (4th or 5th Gen)",
                "type": "Used or Entry New",
                "why": "The benchmark family executive sedan. Free-revving 121 BHP naturally aspirated engine, sofa-like rear seat comfort, and indestructible long-term mechanical reliability.",
                "pros": ["Silky smooth 1.5L 4-cylinder engine with exciting high-RPM VTEC roar", "Best-in-class rear seat legroom for family and parents", "Low cost of routine ownership"],
                "cons": ["Soft rear suspension can bottom out on full load over unscientific high speed breakers", "Factory stock tyres are narrow (recommend upgrading to 195/55 R16)", "Insulation / road noise at 120 km/h is average"]
            },
            {
                "name": "Hyundai i20 N-Line 1.0 Turbo GDi (6-Speed iMT / 7-Speed DCT)",
                "type": "New or Pre-Owned",
                "why": "A factory hot-hatch with 30% stiffer damping, throatier exhaust note, 4-wheel disc brakes, and a quick-ratio steering rack.",
                "pros": ["Addictive exhaust pops and enthusiastic handling", "Rich, modern cabin tech with premium Bose audio", "Compact footprint for easy city parking"],
                "cons": ["Stiff ride on rough/broken roads", "Turbo petrol is thirsty in heavy city traffic (8-10 km/l)", "DCT requires careful maintenance in bumper-to-bumper crawls"]
            }
        ],
        "mileage": "City: 10-12 km/l (Petrol Turbo) / 14-16 km/l (Diesel) | Highway: 16-20 km/l",
        "service_budget": "₹8,000 - ₹14,000 annually with scheduled synthetic oil intervals.",
        "failure_points": "DCT transmission clutch wear in heavy crawling traffic, DPF soot accumulation in BS6 diesels driven strictly on short city trips, front brake pad wear on enthusiastic turbo cars.",
        "sleeper": "Renault Duster 1.3 Turbo Petrol (156 BHP / 254 Nm) — ride quality that completely embarrasses ₹40 Lakh luxury SUVs paired with a Mercedes-derived engine.",
        "checklist": [
            "Test automatic gearbox responsiveness in stop-and-go crawls without throttle input.",
            "Verify air conditioning cooling under direct afternoon sunlight.",
            "Inspect steering rack for play and front lower control arm bushes for cracking.",
            "Check VAHAN records for clean hypothecation NOC and single ownership documentation."
        ]
    },
    "₹12L - ₹20L": {
        "primary_recommendations": [
            {
                "name": "Volkswagen Virtus GT Plus 1.5 TSI / Skoda Slavia 1.5 TSI",
                "type": "New or Pre-Owned",
                "why": "The undisputed dynamic benchmark under ₹20 Lakhs. 150 BHP / 250 Nm with active cylinder deactivation, 5-Star Global NCAP safety, and high-speed road holding.",
                "pros": ["Exhilarating 0-100 km/h in under 9 seconds", "Segment-best 521-litre luggage boot capacity", "5-Star Global NCAP adult & child safety rating"],
                "cons": ["Occasional cabin dashboard creaks on bad roads", "Touch AC controls require taking eyes off the road", "DSG automatic requires strict maintenance discipline"]
            },
            {
                "name": "Honda Elevate 1.5 i-VTEC / Hyundai Creta 1.5",
                "type": "New",
                "why": "Elevate delivers class-leading 220mm ground clearance and class-leading low-speed ride comfort; Creta offers unmatched panoramic features and widespread service peace of mind.",
                "pros": ["Comfortable pothole absorption on urban commutes", "Proven, naturally aspirated drivetrains with zero turbo lag", "Massive resale value retention"],
                "cons": ["Elevate engine gets vocal when pushed past 4,000 RPM", "Creta crash structure rating is lower than European counterparts", "No diesel option on Elevate"]
            },
            {
                "name": "Mahindra Thar 4x4 / Scorpio-N Z4/Z8 (Diesel)",
                "type": "New or Pre-Owned",
                "why": "Monstrous street presence, commanding high seating position, and indestructible ladder-frame chassis that laughs at Indian monsoon roads.",
                "pros": ["Immense road presence and commanding visibility", "Torquey 2.2L mHawk diesel engine with effortless pulling power", "Real off-road go-anywhere capability"],
                "cons": ["Vertical body bobbing / bounciness over uneven highway dips", "Thar 3-door has cramped rear access (opt for 5-door Roxx if family car)", "Heavy fuel consumption on petrol variants"]
            }
        ],
        "mileage": "City: 9-11 km/l (1.5 TSI / Petrol AT) / 12-14 km/l (Diesel AT) | Highway: 15-18 km/l",
        "service_budget": "₹10,000 - ₹18,000 per year with official 4-year service value packs.",
        "failure_points": "DQ200 DSG mechatronics if subjected to severe overheating, DEF/AdBlue sensor errors on BS6 diesels in sub-zero trips, brake rotor squeal at crawl speeds.",
        "sleeper": "Skoda Octavia 1.8 TSI (2018-2020 Pre-Owned) — executive luxury sedan with independent rear suspension and remap potential to 240+ BHP.",
        "checklist": [
            "Check transmission fluid service history and scan for DSG temperature warnings.",
            "Inspect panoramic sunroof drainage pipes for debris and water leakage.",
            "Verify brake disc thickness and check for vibration under 100-0 km/h hard braking.",
            "Verify battery health and electrical harness condition."
        ]
    },
    "₹20L - ₹35L": {
        "primary_recommendations": [
            {
                "name": "Mahindra XUV700 AX7L Diesel AWD / Toyota Innova Hycross Hybrid",
                "type": "New",
                "why": "XUV700 provides 185 BHP mHawk power with ADAS and AWD security; Innova Hycross Hybrid delivers 18-20 km/l real city mileage and bulletproof Toyota reliability.",
                "pros": ["Outstanding high-speed highway cruising and comfort", "Hycross delivers phenomenal city fuel efficiency for a massive 7-seater", "Top-tier safety tech and passenger room"],
                "cons": ["Long delivery waiting periods on specific trims", "XUV700 infotainment screen has minor software updates pending", "Hycross interior plastic quality feels utilitarian for a ₹35L vehicle"]
            },
            {
                "name": "Skoda Octavia 2.0 TSI L&K / Hyundai Ioniq 5 (Pre-Owned/New)",
                "type": "Pre-Owned or EV",
                "why": "Octavia 2.0 TSI is a refined 190 BHP executive missile with wet-clutch DQ381 reliability; Ioniq 5 is the most futuristic, ultra-fast charging EV on Indian roads.",
                "pros": ["Sportscar-rivalling mid-range acceleration", "Exceptional cabin soundproofing and European audio fidelity", "Huge rear passenger legroom"],
                "cons": ["Octavia ground clearance requires care over oversized speed breakers", "Requires 95 RON premium petrol", "EV charging infrastructure planning needed on remote highways"]
            }
        ],
        "mileage": "City: 8-10 km/l (2.0 TSI) / 18-21 km/l (Hycross Hybrid) | Highway: 14-17 km/l (Diesel/TSI)",
        "service_budget": "₹14,000 - ₹24,000 per year.",
        "failure_points": "Water pump thermostat housing weepage on 2.0 TSI engines around 60k km, 18-inch tyre sidewall damage from sharp pothole edges, AdBlue injector crystallization.",
        "sleeper": "BMW 330i (F30 / G20 Pre-Owned) — pure rear-wheel drive chassis with the legendary B48 engine and bulletproof ZF 8-speed torque converter gearbox.",
        "checklist": [
            "Inspect coolant expansion tank for level drops and thermostat housing crusting.",
            "Check all 4 alloy rims for inner-lip bends from Indian highway potholes.",
            "Scan all ADAS camera and radar calibration logs.",
            "Check battery age and auxiliary electronics."
        ]
    },
    "₹35L - ₹75L": {
        "primary_recommendations": [
            {
                "name": "BMW 330i / M340i xDrive (G20) / BMW 530d (G30)",
                "type": "Pre-Owned / New",
                "why": "The ultimate enthusiast driver's cars in India. 530d offers an earth-shattering 620 Nm of inline-6 diesel torque; M340i delivers 382 BHP B58 performance that beats supercars.",
                "pros": ["Near-perfect 50:50 front-to-rear chassis weight distribution", "ZF 8-speed automatic is the most reliable and rapid gearbox in the world", "B58 and B48 engines have legendary mechanical durability"],
                "cons": ["Stiff M-Sport suspension on broken city tarmac", "Costly OEM brake rotors and run-flat tyre replacements", "Lower ground clearance requires disciplined approach angles"]
            },
            {
                "name": "Triumph Street Triple 765 RS / Ducati Panigale V4 S / BMW S1000RR",
                "type": "Superbike",
                "why": "Street Triple is the sweet spot of usable 130 BHP street agility; Panigale V4 S is pure Italian motorsport emotion; S1000RR is the clinical electronic powerhouse.",
                "pros": ["Incredible power-to-weight thrills and acoustic howl", "Top-shelf Brembo Stylema and Ohlins semi-active suspension", "IMU cornering ABS and traction control security"],
                "cons": ["Extreme engine heat in Indian stop-and-go traffic", "Tyres (Pirelli Supercorsa) wear out within 4,000 km (₹40,000/set)", "Desmo valve clearances cost ₹60,000+ on Ducati"]
            }
        ],
        "mileage": "City: 6-8 km/l (M340i / Panigale) / 10-12 km/l (530d / 330i) | Highway: 12-15 km/l",
        "service_budget": "₹25,000 - ₹55,000 annually. Superbike Desmo service at 24k km costs ₹65,000 - ₹85,000.",
        "failure_points": "Run-flat tyre sidewall bulges on pothole impacts (recommend switching to tubeless Michelin Pilot Sport 4S), coolant hose brittleness after 5 years, brake pad sensor replacements.",
        "sleeper": "Porsche Macan S (3.0 V6) or Audi S5 Sportback (Pre-Owned) — executive daily usability with sportscar acceleration.",
        "checklist": [
            "Check complete authorized BMW/Porsche digital service history keys.",
            "Verify paint thickness meter readings for hidden body repairs.",
            "Check launch control counter in ECU logs.",
            "Inspect active suspension dampers for hydraulic seal weeping."
        ]
    }
}


def build_system_prompt() -> str:
    return """
You are the Lead Automotive Consultant at TorqueTrader India.
Your advice is 100% UNBIASED, UNFILTERED, PR-FREE, and tailored specifically to Indian driving conditions.

Tone & Requirements:
1. Always name EXACT car/bike models, variant trims, and engine options.
2. Give REAL-WORLD numbers: bumper-to-bumper city mileage (not ARAI lab claims), annual maintenance cost in rupees, and specific known failure points (DSG mechatronics, water pump leaks, ABS sensors, DPF soot).
3. Factor in Indian realities: speed bumps, monsoon waterlogging, heat management in traffic, spare parts availability, and resale value.

Structure the response with these exact 5 markdown sections:
### 1. The Unvarnished Verdict
Direct recommendation tailored to their budget, city, and top priorities.

### 2. Contender Comparative Breakdown
Pros, Cons, and Crucial Dealbreakers of the primary contenders.

### 3. Real-World Ownership Reality
Real city fuel economy, annual maintenance bill, and known mechanical/electrical failure points.

### 4. The Smart "Sleeper" Alternative
The vehicle in the new or used market they may have overlooked that delivers superior value for money.

### 5. Pre-Purchase & Test-Drive Inspection Checklist
Exact mechanical points to inspect before putting money down.
"""


def generate_advisory_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate deeply specific, priority-calibrated automotive advisory analysis.
    """
    budget = data.get("budget", "₹12L - ₹20L")
    condition = data.get("condition", "New or Used")
    city = data.get("city", "Mumbai / Delhi-NCR / Bangalore")
    usage = data.get("usage", "Daily City Commute + Highway")
    priorities = data.get("priorities", ["Safety & Crash Rating (5-Star NCAP)", "Ride Comfort & Pothole Absorption"])
    contenders = data.get("contenders", "").strip()
    notes = data.get("notes", "").strip()

    # If Gemini API key is configured, call Gemini API
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            user_prompt = f"""
Buyer Profile:
- Budget Tier: {budget}
- Vehicle Condition: {condition}
- City / Environment: {city}
- Primary Usage: {usage}
- Top Priorities: {', '.join(priorities) if isinstance(priorities, list) else priorities}
- Shortlisted Contenders: {contenders or 'Please provide best matching vehicles'}
- Buyer Questions/Notes: {notes or 'Provide comparative analysis'}

Please provide your complete, unfiltered, highly specific automotive dossier naming exact vehicle models, real fuel economy figures, exact annual service costs in rupees, known failure points, and a smart sleeper alternative. Follow the required 5-section structure.
"""
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": build_system_prompt() + "\n\n" + user_prompt}]}
                ],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1800}
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
                                "summary_title": f"Dossier: {contenders or 'Top Recommendations'} for {city}",
                                "budget_tier": budget,
                            }
        except Exception as err:
            logger.error("Gemini API call failed: %s", err)

    # Granular Specific Engine
    matched_tier = SEGMENT_CATALOG.get(budget) or SEGMENT_CATALOG.get("₹12L - ₹20L")
    p1 = matched_tier["primary_recommendations"][0]
    p2 = matched_tier["primary_recommendations"][1]
    priority_str = ", ".join(priorities) if isinstance(priorities, list) else priorities

    analysis_md = f"""### 1. The Unvarnished Verdict
For your budget of **{budget}** in **{city}** with top priorities focused on **{priority_str}**, here is our direct advice:

If you are evaluating **{contenders or p1['name'] + ' vs ' + p2['name']}**, the single most important factor in {city} is balancing low-speed suspension bump absorption over unscientific speed breakers against real-world maintenance costs.

* **Top Pick:** **{p1['name']}** ({p1['type']}) — {p1['why']}
* **Runner-Up:** **{p2['name']}** ({p2['type']}) — {p2['why']}

---

### 2. Contender Comparative Breakdown
* **Option A: {p1['name']}**
  * **Strengths:** {'; '.join(p1['pros'])}.
  * **Crucial Dealbreakers:** {'; '.join(p1['cons'])}.
* **Option B: {p2['name']}**
  * **Strengths:** {'; '.join(p2['pros'])}.
  * **Crucial Dealbreakers:** {'; '.join(p2['cons'])}.

---

### 3. Real-World Ownership Reality in {city}
* **Real City Fuel Economy in Traffic:** {matched_tier['mileage']}
* **Expected Annual Periodic Service Bill:** {matched_tier['service_budget']}
* **Known Mechanical & Electrical Failure Points:** {matched_tier['failure_points']}

---

### 4. The Smart "Sleeper" Alternative
* **{matched_tier['sleeper']}**
  * *Why you should consider it:* Delivers a superior ratio of performance and lower depreciation loss without compromising your core requirements.

---

### 5. Pre-Purchase & Test-Drive Inspection Checklist
Before paying any booking token or transferring funds:
1. {matched_tier['checklist'][0]}
2. {matched_tier['checklist'][1]}
3. {matched_tier['checklist'][2]}
4. {matched_tier['checklist'][3]}
"""

    return {
        "source": "torque_expert_engine",
        "analysis_markdown": analysis_md,
        "summary_title": f"Dossier: {p1['name']} & Contenders for {city}",
        "budget_tier": budget,
    }
