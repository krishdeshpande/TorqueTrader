import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyzeVehicleAdvisory, sendAdvisorChatMessage } from '../api';
import { toast } from '../context/ToastContext';
import { Icons } from '../components/Icons';
import ConsultingBookingModal from '../components/ConsultingBookingModal';
import './Advisor.css';

const BUDGET_OPTIONS = [
  { value: "Under ₹1.5L", label: "Under ₹1.5L", desc: "Commuters, used 150-200cc bikes, budget runabouts" },
  { value: "₹1.5L - ₹3L", label: "₹1.5L - ₹3L", desc: "Entry enthusiast bikes (Duke/Hunter), reliable used cars (Swift/Brio)" },
  { value: "₹3L - ₹6L", label: "₹3L - ₹6L", desc: "Quarter-litre bikes (390 Duke/650 Twin), solid hatchbacks (Polo/Figo)" },
  { value: "₹6L - ₹12L", label: "₹6L - ₹12L", desc: "Compact SUVs (Nexon/Brezza), sedans (City), premium bikes" },
  { value: "₹12L - ₹20L", label: "₹12L - ₹20L", desc: "Mid-size SUVs (Creta/Elevate), dynamic sedans (Virtus/Slavia)" },
  { value: "₹20L - ₹35L", label: "₹20L - ₹35L", desc: "Executive 4x4s (Scorpio/XUV), Hycross Hybrid, middleweights" },
  { value: "₹35L - ₹75L", label: "₹35L - ₹75L", desc: "Luxury sports sedans (BMW 330i/M340i), liter-class superbikes" },
  { value: "₹75L+", label: "₹75L+", desc: "Supercars (Porsche 911), super sedans (M5), exotic machines" },
];

const CATEGORY_OPTIONS = [
  { value: "Car / SUV", label: "Car / SUV", icon: "🚗" },
  { value: "Motorcycle / Superbike", label: "Motorcycle / Superbike", icon: "🏍️" },
  { value: "Open to Either", label: "Open to Either", icon: "⚡" },
];

const CONDITION_OPTIONS = [
  { value: "Brand New Showroom Only", label: "Brand New Only", desc: "Full factory warranty, zero previous owner history" },
  { value: "Pre-Owned / Used Only", label: "Pre-Owned (Max Value)", desc: "Depreciation saved, bigger engine or higher segment" },
  { value: "New or Used", label: "Open to Both", desc: "Recommend whichever offers the superior value for money" },
];

const TRANSMISSION_OPTIONS = [
  { value: "Manual (Pure Driver Engagement)", label: "Manual (6-Speed MT)", desc: "Lowest maintenance, direct clutch control" },
  { value: "Torque Converter Automatic (Smooth & Reliable)", label: "Torque Converter AT", desc: "Bulletproof in city crawl, zero overheating" },
  { value: "Dual-Clutch / DSG / DCT (Lightning Fast)", label: "Dual-Clutch / DSG", desc: "Instantaneous shifts, enthusiast driving feel" },
  { value: "CVT (Relaxed City Commute)", label: "CVT Automatic", desc: "Rubber-band free, seamless city ease" },
  { value: "Any Automatic / No Preference", label: "Any Automatic / No Pref", desc: "Comfortable for daily traffic, open to any type" },
];

const USAGE_OPTIONS = [
  { value: "Daily Bumper-to-Bumper City Traffic", label: "Daily Heavy City Traffic", desc: "Crawl speeds, potholes, tight parking spaces" },
  { value: "Highway Expressway Touring & Intercity", label: "Highway / Expressway Touring", desc: "100-120 km/h cruising, cross-country trips" },
  { value: "Mixed 50/50 Commute & Weekend Roadtrips", label: "50/50 Commute + Roadtrips", desc: "Weekday office + weekend highway balance" },
  { value: "Enthusiast Mountain Twisties / Trackday Fun", label: "Enthusiast / Mountain Ghats", desc: "Spirited driving, corner carving, apex hunting" },
];

const PRIORITY_OPTIONS = [
  "5-Star Crash Safety & Heavy-Duty Build",
  "Ride Comfort & Pothole / Speedbreaker Absorption",
  "Real-World Mileage in City Traffic",
  "Bulletproof Reliability & Inexpensive Spares",
  "Pure Performance & High-Speed Dynamics",
  "Rear-Seat Space for Parents/Family & Luggage Boot",
  "Resale Value Stability & High Liquidity",
  "Refined NVH & Cabin Sound Insulation"
];

const FEATURE_OPTIONS = [
  "Ventilated Front Seats (Summer comfort)",
  "Wireless Android Auto / Apple CarPlay",
  "Sunroof / Panoramic Sunroof",
  "ADAS Safety & 360-Degree Camera",
  "High Ground Clearance (>190mm)",
  "Cruise Control (Expressway ease)",
  "LED Projectors & Cornering Lights",
  "None / Purely Mechanical Simplicity"
];

const MAINTENANCE_OPTIONS = [
  { value: "Zero Drama", label: "\"Zero Drama\" (Fill & Forget)", desc: "Japanese/Korean reliability. Low service bills, cheap parts." },
  { value: "Enthusiast Care", label: "\"Enthusiast Care\" (Driving Thrill First)", desc: "Happy with European/specialist maintenance for exceptional dynamics." }
];

const SUGGESTED_FOLLOWUPS = [
  "What are the realistic maintenance costs after 5 years?",
  "How does the rear seat comfort compare with family rivals?",
  "Which specific variant has the highest resale value?",
  "Is the automatic gearbox safe in heavy monsoon traffic?"
];

export default function Advisor() {
  // Step in diagnostic flow: 1 to 9 (or 'verdict')
  const [step, setStep] = useState(1);

  // Diagnostic State
  const [category, setCategory] = useState("Car / SUV");
  const [budget, setBudget] = useState("₹12L - ₹20L");
  const [condition, setCondition] = useState("New or Used");
  const [transmission, setTransmission] = useState("Any Automatic / No Preference");
  const [usage, setUsage] = useState("Daily Bumper-to-Bumper City Traffic");
  const [city, setCity] = useState("Mumbai / Bangalore / Delhi-NCR");
  const [priorities, setPriorities] = useState([
    "5-Star Crash Safety & Heavy-Duty Build",
    "Ride Comfort & Pothole / Speedbreaker Absorption"
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
          content: `I've synthesized your custom automotive dossier based on your **${budget}** budget, **${transmission}** requirement, and **${priorities.join(' & ')}** priority in **${city}**.\n\nYou can ask any follow-up questions below—like maintenance timelines, variant tradeoffs, or specific comparison queries.`
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
              Zero dealership sponsorships. Zero brand PR bias. Our conversational diagnostic engine evaluates Indian road realities—real-world city crawl mileage, low-speed pothole absorption, known mechanical failure points, and exact sweet-spot variant recommendations.
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
                  {step === 1 && "Vehicle Classification"}
                  {step === 2 && "Budget Calibration"}
                  {step === 3 && "Showroom vs. Pre-Owned Appetite"}
                  {step === 4 && "Transmission Preference"}
                  {step === 5 && "Usage & City Environment"}
                  {step === 6 && "Core Value Priorities"}
                  {step === 7 && "Non-Negotiable Features"}
                  {step === 8 && "Maintenance Mindset & Contenders"}
                </span>
              </div>
              <div className="diag-track">
                <div className="diag-fill" style={{ width: `${(step / 8) * 100}%` }} />
              </div>
            </div>

            <div className="diag-body">
              {/* ── STEP 1: CATEGORY ── */}
              {step === 1 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 01</span>
                    <h2 className="diag-question-title">What type of machine are you looking to acquire?</h2>
                    <p className="diag-question-sub">Select the primary automotive category you want to evaluate.</p>
                  </div>
                  <div className="chip-cards-grid grid-3">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`chip-card ${category === cat.value ? 'selected' : ''}`}
                        onClick={() => {
                          setCategory(cat.value);
                          setStep(2);
                        }}
                      >
                        <span className="chip-card-icon">{cat.icon}</span>
                        <span className="chip-card-title">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 2: BUDGET ── */}
              {step === 2 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 02</span>
                    <h2 className="diag-question-title">What is your realistic budget bracket?</h2>
                    <p className="diag-question-sub">
                      From entry commuters and used runabouts to multi-cylinder superbikes and luxury machines.
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    {BUDGET_OPTIONS.map((b) => (
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
                      Used vehicles save steep first-year depreciation; brand-new cars provide zero-wear warranty peace of mind.
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

              {/* ── STEP 4: TRANSMISSION ── */}
              {step === 4 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 04</span>
                    <h2 className="diag-question-title">What is your transmission requirement?</h2>
                    <p className="diag-question-sub">
                      Manual, Dual-Clutch DSG, Torque Converter, or relaxed CVT for urban driving?
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    {TRANSMISSION_OPTIONS.map((t) => (
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
                    <h2 className="diag-question-title">Where and how will this vehicle primarily run?</h2>
                    <p className="diag-question-sub">
                      Matches suspension damping, ground clearance, and heat dissipation to your driving reality.
                    </p>
                  </div>
                  <div className="chip-cards-grid grid-2">
                    {USAGE_OPTIONS.map((u) => (
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
                    <label className="form-label">City / Region (For RTO tax and pothole calibration)</label>
                    <input
                      type="text"
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Bangalore, Delhi-NCR, Hyderabad, Pune"
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
                      Pick what matters most to you ({priorities.length}/3 selected). We evaluate trade-offs based on these.
                    </p>
                  </div>
                  <div className="pill-selector-grid">
                    {PRIORITY_OPTIONS.map((p) => (
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
                      Continue to Features ({priorities.length} Selected) {Icons.arrowRight}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 7: NON-NEGOTIABLE FEATURES ── */}
              {step === 7 && (
                <div className="diag-step-container">
                  <div className="diag-q-meta">
                    <span className="q-badge">STEP 07</span>
                    <h2 className="diag-question-title">Any Non-Negotiable Features?</h2>
                    <p className="diag-question-sub">
                      Used by our <strong>Variant Suggester</strong> to pinpoint the exact trim without overpaying for useless extras.
                    </p>
                  </div>
                  <div className="pill-selector-grid">
                    {FEATURE_OPTIONS.map((f) => (
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
                    <h2 className="diag-question-title">Maintenance Mindset & Contenders</h2>
                    <p className="diag-question-sub">
                      Are you looking for zero-drama reliability, or comfortable with scheduled enthusiast upkeep for performance?
                    </p>
                  </div>

                  <div className="chip-cards-grid grid-2" style={{ marginBottom: 20 }}>
                    {MAINTENANCE_OPTIONS.map((m) => (
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
                    <label className="form-label">Specific Contenders You Are Considering (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Slavia 1.5 vs Virtus GT vs Creta or Speed 400 vs 390 Duke"
                      value={contenders}
                      onChange={(e) => setContenders(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label">Any specific questions, doubts, or family constraints? (Optional)</label>
                    <textarea
                      rows={2}
                      className="input"
                      placeholder="e.g. Need great AC for humid weather; backseat comfort for parents over sharp rumblers."
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
                      {loading ? 'Synthesizing Automotive Dossier...' : 'Synthesize AI Automotive Verdict'}
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
                  Restart Diagnostic
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
                <span className="verdict-tag">AUTOMOTIVE DIAGNOSTIC COMPLETE</span>
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
                  <span className="chat-avatar-icon">🏎️</span>
                  <div>
                    <h3 className="chat-bot-title">TorqueTrader AI Automotive Consultant</h3>
                    <span className="chat-bot-status">● Live & Calibrated to Your {budget} Profile</span>
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
                  {SUGGESTED_FOLLOWUPS.map((prompt, i) => (
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
                  placeholder="Ask a question (e.g. 'How does maintenance compare with Elevate after 50k km?')"
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
