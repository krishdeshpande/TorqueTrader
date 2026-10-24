import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyzeVehicleAdvisory, sendAdvisorChatMessage } from '../api';
import { toast } from '../context/ToastContext';
import { Icons } from '../components/Icons';
import ConsultingBookingModal from '../components/ConsultingBookingModal';
import './Advisor.css';

// ── CAR OPTIONS CONFIGURATION ───────────────────────────────────────────────
const CAR_BUDGETS = [
  { value: "Under ₹6L", label: "Under ₹6L", desc: "First cars, daily beaters, entry hatchbacks (Alto, used Figo/Polo)" },
  { value: "₹6L - ₹12L", label: "₹6L - ₹12L", desc: "Sub-compact SUVs (Nexon/Brezza), sedans (City), hot hatches (i20 N-Line)" },
  { value: "₹12L - ₹20L", label: "₹12L - ₹20L", desc: "Mid-size SUVs (Creta/Elevate), dynamic turbo sedans (Virtus GT/Slavia 1.5)" },
  { value: "₹20L - ₹35L", label: "₹20L - ₹35L", desc: "Executive 4x4s (Scorpio-N/XUV700), Innova Hycross Hybrid" },
  { value: "₹35L - ₹75L", label: "₹35L - ₹75L", desc: "Luxury sports sedans (BMW 330i/M340i, 530d), Audi S5" },
  { value: "₹75L+", label: "₹75L+", desc: "Supercars (Porsche 911), super sedans (BMW M5), luxury exotics" },
];

const CAR_TRANSMISSIONS = [
  { value: "Manual (6-Speed MT)", label: "Manual (6-Speed MT)", desc: "Maximum driver involvement, lowest upkeep" },
  { value: "Torque Converter Automatic (Smooth & Reliable)", label: "Torque Converter AT", desc: "Bulletproof in stop-and-go city crawl, zero overheating" },
  { value: "Dual-Clutch / DSG / DCT (Lightning Fast)", label: "Dual-Clutch / DSG / DCT", desc: "Instantaneous paddle-shifts, enthusiast driving dynamics" },
  { value: "CVT Automatic (Relaxed City Commute)", label: "CVT Automatic", desc: "Rubber-band free, seamless linear city commute" },
  { value: "Any Automatic / No Preference", label: "Any Automatic / No Pref", desc: "Relaxed urban convenience, open to any automatic type" },
];

const CAR_USAGES = [
  { value: "Daily Bumper-to-Bumper City Traffic", label: "Daily Heavy City Traffic", desc: "Stop-and-go crawling, tight parking, urban potholes" },
  { value: "Highway Expressway Touring & Intercity", label: "Highway / Expressway Touring", desc: "100-120 km/h cruising, cross-state family trips" },
  { value: "Mixed 50/50 Commute & Weekend Roadtrips", label: "50/50 Commute + Roadtrips", desc: "Balanced weekday office + weekend getaway use" },
  { value: "Rough / Broken Roads & Bad Speedbreakers", label: "Broken Roads / Speedbreakers", desc: "Monsoon craters, high unscientific humps, rural trips" },
];

const CAR_PRIORITIES = [
  "5-Star Crash Safety & Heavy-Duty Build (Global NCAP)",
  "Low-Speed Ride Comfort & Pothole Absorption",
  "Real-World Mileage in City Traffic",
  "Rear-Seat Space for Elderly Parents & Boot Space",
  "Pure Performance & High-Speed Highway Dynamics",
  "Bulletproof Reliability & Inexpensive Spares",
  "Resale Value Stability & High Liquidity",
  "Refined Cabin Sound Insulation (NVH)"
];

const CAR_FEATURES = [
  "Ventilated Front Seats (Crucial for Indian summers)",
  "Wireless Android Auto / Apple CarPlay",
  "Sunroof / Panoramic Sunroof",
  "ADAS Safety & 360-Degree Camera",
  "High Ground Clearance (>190mm)",
  "Cruise Control (Expressway ease)",
  "Hill Hold & Electronic Stability Control (ESC)",
  "None / Purely Mechanical Simplicity"
];

const CAR_MAINTENANCE = [
  { value: "Zero Drama", label: "\"Zero Drama\" (Fill & Forget)", desc: "Japanese/Korean reliability (Maruti/Toyota/Honda). Low service bills, cheap parts." },
  { value: "Enthusiast Care", label: "\"Enthusiast Care\" (Driving Thrill First)", desc: "Happy with scheduled European/specialist care (Skoda/VW/BMW) for great dynamics." }
];

// ── BIKE OPTIONS CONFIGURATION ──────────────────────────────────────────────
const BIKE_BUDGETS = [
  { value: "Under ₹1.5L", label: "Under ₹1.5L", desc: "Commuters, used 150-200cc bikes (Splendor, Raider 125, Pulsar NS200, FZ)" },
  { value: "₹1.5L - ₹3L", label: "₹1.5L - ₹3L", desc: "Entry performance & classics (Hunter 350, Classic 350, MT-15 V2, Duke 200/250)" },
  { value: "₹3L - ₹6L", label: "₹3L - ₹6L", desc: "Quarter-litre & twins (390 Duke Gen 3, Interceptor 650, Himalayan 450, Ninja 300)" },
  { value: "₹6L - ₹12L", label: "₹6L - ₹12L", desc: "Middleweight performance (Trident 660, Z650, Aprilia RS 457, Ninja 650)" },
  { value: "₹12L - ₹20L", label: "₹12L - ₹20L", desc: "Middleweight supersports & triples (Street Triple 765 RS, Z900, Ducati Monster)" },
  { value: "₹20L - ₹35L", label: "₹20L - ₹35L", desc: "Liter-class track weapons & ADVs (Ninja ZX-10R, BMW S1000RR, Africa Twin)" },
  { value: "₹35L+", label: "₹35L+", desc: "Flagship exotics (Ducati Panigale V4 S, BMW M1000RR, R1300GS Adventure)" },
];

const BIKE_TRANSMISSIONS = [
  { value: "6-Speed Manual with Assist & Slipper Clutch", label: "6-Speed with Slipper Clutch", desc: "Prevents rear-wheel hop on aggressive downshifts, light lever pull" },
  { value: "Bi-directional Quickshifter (Clutchless Up/Down)", label: "Bi-directional Quickshifter", desc: "Clutchless up & down gear shifts for track and spirited canyon carving" },
  { value: "Standard 5-Speed Manual (Relaxed Gearing)", label: "Standard 5-Speed Manual", desc: "Relaxed cruiser and daily commuter gearing, long torque spread" },
  { value: "Automatic / DCT / E-Clutch (Zero Clutch Fatigue)", label: "Automatic / DCT / E-Clutch", desc: "Dual-clutch or e-clutch for relaxed touring with zero clutch fatigue" },
];

const BIKE_USAGES = [
  { value: "Daily City Office Commute & Traffic Filtering", label: "Daily City Commute & Filtering", desc: "Lane filtering, bumper-to-bumper crawl, light clutch priority" },
  { value: "Sunday Morning Highway Breakfast Rides (60 - 150 km)", label: "Weekend Morning Highway Rides", desc: "Spirited 100-150 km dawn runs, open toll expressways, winding curves" },
  { value: "Long-Distance Touring & Mountain Expeditions (500+ km)", label: "Long-Distance Touring / ADV", desc: "All-day saddle comfort, luggage mounting, Ladakh/Himalayan trails" },
  { value: "Track Days & Aggressive Knee-down Corner Carving", label: "Track Days & Apex Carving", desc: "Knee-down track days, high-RPM agility, aggressive braking zones" },
];

const BIKE_PRIORITIES = [
  "Pure Cornering Agility & Power-to-Weight Acceleration",
  "Upright Ergonomics & Wind Protection for Long Touring",
  "Low Engine Heat Dissipation in Heavy City Traffic",
  "Bulletproof Reliability & Readily Available Spares",
  "Pillion Seat Usability & Rear Comfort",
  "Exhaust Note & Muscular Road Presence",
  "Low Kerb Weight & Light Steering for Daily Ease",
  "High Ground Clearance & Pothole / Bad Road Damping"
];

const BIKE_FEATURES = [
  "Dual-Channel ABS / IMU Cornering ABS",
  "Assist & Slipper Clutch",
  "Bi-directional Quickshifter (Up & Down)",
  "Switchable Traction Control & Riding Modes",
  "Tubeless Spoke Wheels (Puncture peace of mind for ADV/Cruiser)",
  "Bluetooth Turn-by-Turn Navigation & TFT Display",
  "Adjustable Front & Rear Suspension (Preload/Damping)",
  "None / Pure Raw Mechanical Riding"
];

const BIKE_MAINTENANCE = [
  { value: "Zero Drama", label: "\"Zero Drama\" (Low Upkeep)", desc: "Low service bills, inexpensive chain/sprockets/tyres, widely available spares (Japanese/Indian)." },
  { value: "Enthusiast Care", label: "\"Enthusiast Care\" (Performance First)", desc: "Happy with premium tyre wear (Pirelli/Metzeler) and European/Desmo valve service costs." }
];

const CONDITION_OPTIONS = [
  { value: "Brand New Showroom Only", label: "Brand New Only", desc: "Full factory warranty, zero previous owner wear" },
  { value: "Pre-Owned / Used Only", label: "Pre-Owned (Max Value)", desc: "Depreciation saved, bigger engine or higher segment machine" },
  { value: "New or Used", label: "Open to Both", desc: "Recommend whichever offers the superior value for money" },
];

export default function Advisor() {
  const [step, setStep] = useState(1);

  // Category choice: 'Car / SUV' or 'Motorcycle / Superbike'
  const [category, setCategory] = useState("Car / SUV");

  // Dynamic parameters based on category
  const [budget, setBudget] = useState("₹12L - ₹20L");
  const [condition, setCondition] = useState("New or Used");
  const [transmission, setTransmission] = useState("Any Automatic / No Preference");
  const [usage, setUsage] = useState("Daily Bumper-to-Bumper City Traffic");
  const [city, setCity] = useState("Mumbai / Bangalore / Delhi-NCR");
  const [priorities, setPriorities] = useState([
    "5-Star Crash Safety & Heavy-Duty Build (Global NCAP)",
    "Low-Speed Ride Comfort & Pothole Absorption"
  ]);
  const [features, setFeatures] = useState(["Wireless Android Auto / Apple CarPlay"]);
  const [maintenanceMindset, setMaintenanceMindset] = useState("Zero Drama");
  const [contenders, setContenders] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // Result & Chat State
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedConsultTier, setSelectedConsultTier] = useState(null);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // When category changes, reset defaults cleanly
  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    if (selectedCat === "Motorcycle / Superbike") {
      setBudget("₹3L - ₹6L");
      setTransmission("6-Speed Manual with Assist & Slipper Clutch");
      setUsage("Daily City Office Commute & Traffic Filtering");
      setPriorities(["Pure Cornering Agility & Power-to-Weight Acceleration", "Low Engine Heat Dissipation in Heavy City Traffic"]);
      setFeatures(["Dual-Channel ABS / IMU Cornering ABS"]);
      setMaintenanceMindset("Zero Drama");
    } else {
      setBudget("₹12L - ₹20L");
      setTransmission("Any Automatic / No Preference");
      setUsage("Daily Bumper-to-Bumper City Traffic");
      setPriorities(["5-Star Crash Safety & Heavy-Duty Build (Global NCAP)", "Low-Speed Ride Comfort & Pothole Absorption"]);
      setFeatures(["Wireless Android Auto / Apple CarPlay"]);
      setMaintenanceMindset("Zero Drama");
    }
    setStep(2);
  };

  const isBike = category === "Motorcycle / Superbike";

  const budgetOptions = isBike ? BIKE_BUDGETS : CAR_BUDGETS;
  const transmissionOptions = isBike ? BIKE_TRANSMISSIONS : CAR_TRANSMISSIONS;
  const usageOptions = isBike ? BIKE_USAGES : CAR_USAGES;
  const priorityOptions = isBike ? BIKE_PRIORITIES : CAR_PRIORITIES;
  const featureOptions = isBike ? BIKE_FEATURES : CAR_FEATURES;
  const maintenanceOptions = isBike ? BIKE_MAINTENANCE : CAR_MAINTENANCE;

  const togglePriority = (p) => {
    if (priorities.includes(p)) {
      if (priorities.length > 1) {
        setPriorities(priorities.filter((item) => item !== p));
      }
    } else {
      if (priorities.length < 3) {
        setPriorities([...priorities, p]);
      } else {
        toast.info('You can select up to 3 core priorities for the sharpest diagnostic match.');
      }
    }
  };

  const toggleFeature = (f) => {
    if (features.includes(f)) {
      setFeatures(features.filter((item) => item !== f));
    } else {
      setFeatures([...features, f]);
    }
  };

  const handleGenerateDossier = async () => {
    setLoading(true);
    try {
      const payload = {
        category,
        budget,
        condition,
        transmission,
        usage,
        city,
        priorities,
        features,
        maintenance_mindset: maintenanceMindset,
        contenders: contenders.trim() || undefined,
        notes: customNotes.trim() || undefined,
      };

      const res = await analyzeVehicleAdvisory(payload);
      setAnalysis(res);
      setStep('verdict');
      setChatMessages([
        {
          role: 'assistant',
          content: `I've synthesized your custom automotive dossier based on your **${budget}** budget, **${transmission}** preference, and **${priorities.join(' & ')}** priority in **${city}**.\n\nYou can ask any follow-up questions below—like maintenance timelines, variant tradeoffs, or specific comparison queries.`
        }
      ]);
      toast.success('Automotive Intelligence dossier generated.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } catch (err) {
      toast.error('Could not generate advisory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim() || chatLoading) return;

    const newMessages = [...chatMessages, { role: 'user', content: text.trim() }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const diagnosticContext = {
        category,
        budget,
        condition,
        transmission,
        city,
        priorities,
        contenders,
      };

      const res = await sendAdvisorChatMessage(newMessages, diagnosticContext);
      if (res && res.content) {
        setChatMessages([...newMessages, { role: 'assistant', content: res.content }]);
      }
    } catch (err) {
      toast.error('Failed to get answer. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const restartDiagnostic = () => {
    setStep(1);
    setAnalysis(null);
    setChatMessages([]);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const bikeSuggestedFollowups = [
    "What is the expected tyre wear and service cost per year?",
    "How does engine heat behave in heavy Indian summer traffic?",
    "Can a pillion ride comfortably on weekend trips?",
    "Which variant offers the best resale value in my city?"
  ];

  const carSuggestedFollowups = [
    "What are the realistic maintenance costs after 5 years?",
    "How does the rear seat comfort compare with family rivals over potholes?",
    "Which specific variant has the highest resale value?",
    "Is the automatic gearbox safe in heavy monsoon traffic crawl?"
  ];

  const suggestedFollowups = isBike ? bikeSuggestedFollowups : carSuggestedFollowups;

  return (
    <div className="advisor-root">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <section className="advisor-hero-section">
        <div className="container">
          <div className="advisor-hero-inner">
            <div className="badge badge-red" style={{ marginBottom: 12 }}>
              UNBIASED AUTOMOTIVE INTELLIGENCE
            </div>
            <h1 className="advisor-main-title">
              AI Auto Advisory & Variant Suggester
            </h1>
            <p className="advisor-hero-desc">
              Zero dealership sponsorships. Zero brand PR bias. Dedicated diagnostic pathways for <strong>Cars & SUVs</strong> and <strong>Motorcycles & Superbikes</strong>—evaluating real city crawl mileage, low-speed pothole absorption, known mechanical failure points, and exact sweet-spot variants.
            </p>
          </div>
        </div>
      </section>

      <div className="container advisor-workspace-wrap">
        {step !== 'verdict' ? (
          /* ── Conversational Questionnaire Mode ──────────────────────────── */
          <div className="diagnostic-card">
            {/* Step Progress Tracker */}
            <div className="diag-progress-bar-wrap">
              <div className="diag-progress-header">
                <span className="diag-step-count">Diagnostic Step {step} of 8</span>
                <span className="diag-step-name">
                  {step === 1 && "Vehicle Classification (Car vs. Motorcycle)"}
                  {step === 2 && (isBike ? "Motorcycle Budget Bracket" : "Car / SUV Budget Bracket")}
                  {step === 3 && "Showroom vs. Pre-Owned Appetite"}
                  {step === 4 && (isBike ? "Clutch & Gearbox Configuration" : "Car Transmission Preference")}
                  {step === 5 && (isBike ? "Riding Usage & Commute Reality" : "Driving Usage & City Environment")}
                  {step === 6 && "Core Value Priorities"}
                  {step === 7 && (isBike ? "Non-Negotiable Motorcycle Equipment" : "Non-Negotiable Car Features")}
                  {step === 8 && "Maintenance Mindset & Contenders"}
                </span>
              </div>
              <div className="diag-track">
                <div className="diag-fill" style={{ width: `${(step / 8) * 100}%` }} />
              </div>
            </div>

            <div className="diag-body">
              {/* ── STEP 1: CATEGORY SELECTION (CAR VS BIKE) ── */}
              {step === 1 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 01</span>
                    <h2 className="diag-question-title">What machine are you looking to evaluate?</h2>
                    <p className="diag-question-sub">
                      Select whether you are buying a car or a motorcycle. Each path features dedicated budgets, transmissions, and mechanical features.
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    <button
                      type="button"
                      className={`chip-card ${category === 'Car / SUV' ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect('Car / SUV')}
                    >
                      <span className="chip-card-icon">🚗</span>
                      <span className="chip-card-title">Car / SUV</span>
                      <span className="chip-card-desc">Hatchbacks, Compact SUVs, Sedans, 4x4s, and Luxury German Cars</span>
                    </button>

                    <button
                      type="button"
                      className={`chip-card ${category === 'Motorcycle / Superbike' ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect('Motorcycle / Superbike')}
                    >
                      <span className="chip-card-icon">🏍️</span>
                      <span className="chip-card-title">Motorcycle / Superbike</span>
                      <span className="chip-card-desc">Commuters, Modern Classics, 300-400cc Singles, Middleweights, and Liter-Class Superbikes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: BUDGET (CATEGORY TAILORED) ── */}
              {step === 2 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 02</span>
                    <h2 className="diag-question-title">What is your realistic budget bracket?</h2>
                    <p className="diag-question-sub">
                      {isBike 
                        ? "Calibrated for motorcycles: from entry commuters and 300cc bikes to liter-class superbikes." 
                        : "Calibrated for cars: from first-time beaters to mid-size SUVs and luxury performance sedans."}
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    {budgetOptions.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        className={`chip-card ${budget === b.value ? 'selected' : ''}`}
                        onClick={() => {
                          setBudget(b.value);
                          setStep(3);
                        }}
                      >
                        <div className="chip-card-header">
                          <span className="chip-card-title">{b.label}</span>
                          {budget === b.value && <span className="chip-check">{Icons.check}</span>}
                        </div>
                        <span className="chip-card-desc">{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 3: NEW VS PRE-OWNED ── */}
              {step === 3 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 03</span>
                    <h2 className="diag-question-title">Are you leaning towards Brand New or Pre-Owned?</h2>
                    <p className="diag-question-sub">
                      Used vehicles save steep initial depreciation; brand-new models provide zero previous owner wear and full factory warranty.
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-3">
                    {CONDITION_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`chip-card ${condition === c.value ? 'selected' : ''}`}
                        onClick={() => {
                          setCondition(c.value);
                          setStep(4);
                        }}
                      >
                        <div className="chip-card-header">
                          <span className="chip-card-title">{c.label}</span>
                          {condition === c.value && <span className="chip-check">{Icons.check}</span>}
                        </div>
                        <span className="chip-card-desc">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 4: TRANSMISSION (SEPARATE FOR CAR VS BIKE) ── */}
              {step === 4 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 04</span>
                    <h2 className="diag-question-title">
                      {isBike ? "What is your clutch & gearbox preference?" : "What is your transmission requirement?"}
                    </h2>
                    <p className="diag-question-sub">
                      {isBike
                        ? "Slipper clutch for smooth downshifts, bi-directional quickshifter for clutchless shifts, or standard 5-speed?"
                        : "Manual, Dual-Clutch DSG, Torque Converter AT, or relaxed CVT for city crawl?"}
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    {transmissionOptions.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={`chip-card ${transmission === t.value ? 'selected' : ''}`}
                        onClick={() => {
                          setTransmission(t.value);
                          setStep(5);
                        }}
                      >
                        <div className="chip-card-header">
                          <span className="chip-card-title">{t.label}</span>
                          {transmission === t.value && <span className="chip-check">{Icons.check}</span>}
                        </div>
                        <span className="chip-card-desc">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 5: USAGE & ENVIRONMENT ── */}
              {step === 5 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 05</span>
                    <h2 className="diag-question-title">
                      {isBike ? "How and where will you primarily ride?" : "Where and how will this car primarily run?"}
                    </h2>
                    <p className="diag-question-sub">
                      Calibrates low-speed suspension bump absorption, engine cooling in traffic, and ground clearance.
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    {usageOptions.map((u) => (
                      <button
                        key={u.value}
                        type="button"
                        className={`chip-card ${usage === u.value ? 'selected' : ''}`}
                        onClick={() => {
                          setUsage(u.value);
                          setStep(6);
                        }}
                      >
                        <div className="chip-card-header">
                          <span className="chip-card-title">{u.label}</span>
                          {usage === u.value && <span className="chip-check">{Icons.check}</span>}
                        </div>
                        <span className="chip-card-desc">{u.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="form-group" style={{ marginTop: 20 }}>
                    <label className="form-label">City / Region (For RTO road tax and pothole calibration)</label>
                    <input
                      type="text"
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Bangalore, Delhi-NCR, Hyderabad, Pune, Chennai"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 6: CORE PRIORITIES ── */}
              {step === 6 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 06</span>
                    <h2 className="diag-question-title">Select your Top 2 or 3 Core Priorities</h2>
                    <p className="diag-question-sub">
                      Choose what matters most to you ({priorities.length}/3 selected). We evaluate trade-offs against these.
                    </p>
                  </div>
                  <div className="pill-selector-grid">
                    {priorityOptions.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`pill-btn ${priorities.includes(p) ? 'active' : ''}`}
                        onClick={() => togglePriority(p)}
                      >
                        {priorities.includes(p) && <span className="pill-icon">{Icons.check}</span>}
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="step-actions-bar">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setStep(7)}
                      disabled={priorities.length === 0}
                    >
                      Continue to Equipment ({priorities.length} Selected) {Icons.arrowRight}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 7: NON-NEGOTIABLE FEATURES (SEPARATE FOR CAR VS BIKE) ── */}
              {step === 7 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 07</span>
                    <h2 className="diag-question-title">
                      {isBike ? "Any Non-Negotiable Motorcycle Equipment?" : "Any Non-Negotiable Car Features?"}
                    </h2>
                    <p className="diag-question-sub">
                      Used by our <strong>Variant Suggester</strong> to pinpoint the exact trim without overpaying for useless extras.
                    </p>
                  </div>
                  <div className="pill-selector-grid">
                    {featureOptions.map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`pill-btn ${features.includes(f) ? 'active' : ''}`}
                        onClick={() => toggleFeature(f)}
                      >
                        {features.includes(f) && <span className="pill-icon">{Icons.check}</span>}
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="step-actions-bar">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setStep(8)}
                    >
                      Next: Maintenance Mindset {Icons.arrowRight}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 8: MAINTENANCE & CONTENDERS ── */}
              {step === 8 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 08</span>
                    <h2 className="diag-question-title">Maintenance Mindset & Shortlisted Contenders</h2>
                    <p className="diag-question-sub">
                      Are you looking for zero-drama reliability, or comfortable with scheduled enthusiast upkeep for performance?
                    </p>
                  </div>

                  <div className="chip-cards-grid grid-2" style={{ marginBottom: 20 }}>
                    {maintenanceOptions.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        className={`chip-card ${maintenanceMindset === m.value ? 'selected' : ''}`}
                        onClick={() => setMaintenanceMindset(m.value)}
                      >
                        <div className="chip-card-header">
                          <span className="chip-card-title">{m.label}</span>
                          {maintenanceMindset === m.value && <span className="chip-check">{Icons.check}</span>}
                        </div>
                        <span className="chip-card-desc">{m.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">
                      {isBike ? "Specific Motorcycles You Are Considering (Optional)" : "Specific Cars You Are Considering (Optional)"}
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder={isBike ? "e.g. 390 Duke vs Interceptor 650 vs Himalayan 450" : "e.g. Slavia 1.5 vs Virtus GT vs Creta Turbo"}
                      value={contenders}
                      onChange={(e) => setContenders(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Any specific questions, doubts, or personal constraints? (Optional)</label>
                    <textarea
                      rows={2}
                      className="input"
                      placeholder={isBike ? "e.g. Radiator heat on shins in traffic; pillion comfort for spouse on weekend rides." : "e.g. Need great AC for humid weather; backseat comfort for parents over sharp rumblers."}
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                    />
                  </div>

                  <div className="step-actions-bar">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ height: 48, padding: '0 28px', fontSize: '1rem' }}
                      onClick={handleGenerateDossier}
                      disabled={loading}
                    >
                      {loading ? 'Synthesizing Automotive Dossier...' : `Synthesize AI ${isBike ? 'Motorcycle' : 'Car'} Verdict`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Back / Reset Controls */}
            {step > 1 && (
              <div className="diag-footer-nav">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  {Icons.arrowLeft} Back to Previous Question
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={restartDiagnostic}
                >
                  Change Category / Restart
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Result Dossier & Interactive Chat Mode ─────────────────────── */
          <div className="verdict-layout">
            {/* Top Action Bar */}
            <div className="verdict-top-bar">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="verdict-tag">AUTOMOTIVE DIAGNOSTIC COMPLETE</span>
                  <span className={`engine-badge ${analysis?.source === 'gemini_ai' ? 'gemini' : 'expert'}`}>
                    {analysis?.source === 'gemini_ai' ? 'Powered by Gemini AI' : 'Expert Diagnostic Matrix'}
                  </span>
                </div>
                <h2 className="verdict-main-title">{analysis?.summary_title || "Your Vehicle Recommendation Dossier"}</h2>
                <div className="verdict-meta-strip">
                  <span className="meta-pill">Category: {category}</span>
                  <span className="meta-pill">Budget: {budget}</span>
                  <span className="meta-pill">City: {city}</span>
                  <span className="meta-pill">Gearbox: {transmission}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={restartDiagnostic}
              >
                Run New Diagnostic
              </button>
            </div>

            {/* Structured Dossier Content */}
            <div className="dossier-rendered-box">
              {analysis?.analysis_markdown.split('\n\n').map((block, i) => {
                if (block.startsWith('### ')) {
                  return (
                    <div key={i} className="dossier-section-head">
                      <h3 className="section-title">{block.replace('### ', '')}</h3>
                    </div>
                  );
                }
                if (block.startsWith('* ') || block.startsWith('1. ') || block.startsWith('2. ') || block.startsWith('3. ') || block.startsWith('4. ')) {
                  return (
                    <div key={i} className="dossier-list-wrap">
                      {block.split('\n').map((line, j) => (
                        <div key={j} className="dossier-list-item">
                          <span className="bullet-sq" />
                          <span>{line.replace(/^(\* |\d+\. )/, '')}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (block === '---') {
                  return <hr key={i} className="dossier-hr" />;
                }
                return <p key={i} className="dossier-body-para">{block}</p>;
              })}
            </div>

            {/* ── Interactive Follow-up Chatbot Console ────────────────────── */}
            <div className="advisory-chat-console">
              <div className="chat-console-header">
                <div className="chat-avatar-box">
                  <span className="chat-avatar-icon">{isBike ? '🏍️' : '🏎️'}</span>
                  <div>
                    <h3 className="chat-bot-title">TorqueTrader AI Automotive Consultant</h3>
                    <span className="chat-bot-status">● Live & Calibrated to Your {category} ({budget}) Profile</span>
                  </div>
                </div>
                <span className="guardrail-badge">Auto Guardrails Active</span>
              </div>

              {/* Message Feed */}
              <div className="chat-feed-box">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <div className="chat-bubble">
                      <span className="bubble-role">{msg.role === 'user' ? 'You' : 'TorqueTrader Advisor'}</span>
                      <div className="bubble-text">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="chat-bubble-row assistant">
                    <div className="chat-bubble loading">
                      <span className="bubble-role">TorqueTrader Advisor</span>
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Suggested Follow-up Chips */}
              <div className="chat-prompts-strip">
                <span className="prompts-label">Quick Inquiries:</span>
                <div className="prompts-grid">
                  {suggestedFollowups.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      className="prompt-chip-btn"
                      onClick={() => handleSendFollowUp(prompt)}
                      disabled={chatLoading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                className="chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendFollowUp();
                }}
              >
                <input
                  type="text"
                  className="chat-text-input"
                  placeholder={isBike ? "Ask a question (e.g. 'How does engine heat compare in crawling traffic?')" : "Ask a question (e.g. 'How does maintenance compare with Elevate after 50k km?')"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="btn btn-primary chat-send-btn"
                  disabled={!chatInput.trim() || chatLoading}
                >
                  Send Inquiry {Icons.arrowRight}
                </button>
              </form>
            </div>

            {/* ── Bridge to 1-on-1 Human Consulting Callout ─────────────────── */}
            <div className="consult-bridge-card">
              <div className="bridge-info">
                <div className="bridge-tag">EXPERT DUE DILIGENCE</div>
                <h3 className="bridge-title">Need a Human Expert to Audit Your Dealer Quotation or Used Inspection?</h3>
                <p className="bridge-desc">
                  Book a direct 1-on-1 strategy call with our founder. We review dealer proforma invoices (cutting out useless showroom accessory padding), vet used inspection logs, and evaluate maintenance histories before you transfer any money.
                </p>
              </div>
              <div className="bridge-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedConsultTier({
                    id: 'strategy_call',
                    title: '1-on-1 Strategy & Selection Call',
                    price: 2999
                  })}
                >
                  Book 1-on-1 Call (Rs 2,999)
                </button>
                <Link to="/consulting" className="btn btn-secondary">
                  View All Consulting Tiers
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedConsultTier && (
        <ConsultingBookingModal
          tier={selectedConsultTier}
          onClose={() => setSelectedConsultTier(null)}
        />
      )}
    </div>
  );
}
