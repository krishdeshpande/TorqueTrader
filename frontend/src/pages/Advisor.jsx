import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeVehicleAdvisory } from '../api';
import { toast } from '../context/ToastContext';
import { Icons } from '../components/Icons';
import ConsultingBookingModal from '../components/ConsultingBookingModal';
import './Advisor.css';

const QUICK_SCENARIOS = [
  {
    label: "Family SUV under ₹18L (Safety + Ride Comfort first)",
    budget: "₹12L - ₹20L",
    condition: "New",
    city: "Mumbai / Bangalore",
    usage: "Daily City Commute + Family Roadtrips",
    priorities: ["Safety & Crash Rating", "Ride Comfort & Pothole Absorption", "Family / Backseat Space"],
    contenders: "Hyundai Creta vs Skoda Kushaq vs Honda Elevate",
    notes: "Prioritizing high safety ratings, stress-free automatic, and smooth ride over potholes for elderly parents."
  },
  {
    label: "Used fun-to-drive daily under ₹8L (Polo TSI vs City vs Figo)",
    budget: "₹4L - ₹8L",
    condition: "Used",
    city: "Bangalore",
    usage: "Daily Office Commute + Weekend Fun",
    priorities: ["Performance & Handling", "Low Maintenance / Reliability", "Safety & Crash Rating"],
    contenders: "VW Polo 1.0 TSI vs Honda City 1.5 i-VTEC vs Ford Figo 1.5 TDCi",
    notes: "Need an engaging, solid daily driver with reasonable spare parts availability and strong chassis balance."
  },
  {
    label: "Virtus GT vs Slavia 1.5 vs Verna Turbo",
    budget: "₹15L - ₹22L",
    condition: "New",
    city: "Delhi-NCR",
    usage: "Highway Cruising + City Traffic",
    priorities: ["Performance & Handling", "Safety & Crash Rating", "Ride Comfort & Pothole Absorption"],
    contenders: "VW Virtus GT Plus 1.5 vs Skoda Slavia 1.5 vs Hyundai Verna 1.5 Turbo",
    notes: "Evaluating long-term DSG reliability vs Verna DCT, high-speed stability, and real-world fuel economy."
  },
  {
    label: "Octavia 1.8 TSI vs BMW 330i F30/G20 (Real Maintenance)",
    budget: "₹18L - ₹32L",
    condition: "Used",
    city: "Mumbai / Pune",
    usage: "Weekend Drives + Expressway Touring",
    priorities: ["Performance & Handling", "Low Maintenance / Reliability", "Real-World Fuel Economy"],
    contenders: "Skoda Octavia 1.8/2.0 TSI vs BMW 330i (F30 / G20)",
    notes: "Which offers superior long-term ownership peace of mind, water pump/mechatronic failure risks, and service cost."
  },
  {
    label: "First Superbike Upgrade from 390 Duke / 650 Twin",
    budget: "₹10L - ₹18L",
    condition: "New or Used",
    city: "Indian Metros",
    usage: "Weekend Morning Rides + Occasional Trackdays",
    priorities: ["Performance & Handling", "Safety & Crash Rating", "Low Maintenance / Reliability"],
    contenders: "Triumph Street Triple 765 RS vs Kawasaki ZX-10R vs Ducati Monster",
    notes: "Evaluating engine heat management in Indian traffic, tyre wear costs, and real-world usable torque."
  }
];

const PRIORITY_OPTIONS = [
  "Safety & Crash Rating (5-Star NCAP)",
  "Ride Comfort & Pothole Absorption",
  "Real-World Fuel Economy (City Traffic)",
  "Low Maintenance & Reliability",
  "Performance & High-Speed Dynamics",
  "Family Space & Boot Practicality",
  "Resale Value Stability",
  "Feature Tech & Screen Quality"
];

export default function Advisor() {
  const [budget, setBudget] = useState('₹12L - ₹20L');
  const [condition, setCondition] = useState('New or Used');
  const [city, setCity] = useState('Mumbai / Bangalore / Delhi-NCR');
  const [usage, setUsage] = useState('Daily City Traffic + Highway Touring');
  const [priorities, setPriorities] = useState([
    "Safety & Crash Rating (5-Star NCAP)",
    "Ride Comfort & Pothole Absorption",
    "Low Maintenance & Reliability"
  ]);
  const [contenders, setContenders] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedConsultTier, setSelectedConsultTier] = useState(null);

  const togglePriority = (p) => {
    if (priorities.includes(p)) {
      if (priorities.length > 1) {
        setPriorities(priorities.filter((item) => item !== p));
      }
    } else {
      if (priorities.length < 4) {
        setPriorities([...priorities, p]);
      } else {
        toast.info('You can select up to 4 top priorities for the most accurate calibration.');
      }
    }
  };

  const loadScenario = (sc) => {
    setBudget(sc.budget);
    setCondition(sc.condition);
    setCity(sc.city);
    setUsage(sc.usage);
    setPriorities(sc.priorities);
    setContenders(sc.contenders);
    setNotes(sc.notes);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await analyzeVehicleAdvisory({
        budget,
        condition,
        city,
        usage,
        priorities,
        contenders: contenders || 'Shortlisted Contenders',
        notes
      });
      setAnalysis(res);
      toast.success('Automotive advisory dossier generated.');
      setTimeout(() => {
        document.getElementById('advisory-results-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toast.error('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advisor-root">
      {/* ── Top Hero Banner ───────────────────────────────────────────────── */}
      <section className="advisor-hero-section">
        <div className="container">
          <div className="advisor-hero-inner">
            <div className="badge badge-red" style={{ marginBottom: 12 }}>
              UNBIASED AUTOMOTIVE INTELLIGENCE
            </div>
            <h1 className="advisor-main-title">
              Indian Automotive Advisory & Buying Intelligence
            </h1>
            <p className="advisor-hero-desc">
              Zero PR fluff. Zero brand sponsorships. Priority-calibrated advice across all cars and superbikes in India—accounting for real-world traffic mileage, suspension comfort on Indian potholes, long-term reliability, and maintenance costs.
            </p>

            {/* Quick Scenario Starter Chips */}
            <div className="quick-scenarios-wrapper">
              <span className="scenarios-heading">Popular Buying Scenarios:</span>
              <div className="scenarios-chip-grid">
                {QUICK_SCENARIOS.map((sc, i) => (
                  <button
                    key={i}
                    type="button"
                    className="scenario-chip-btn"
                    onClick={() => loadScenario(sc)}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Diagnostic Workspace ─────────────────────────────────────── */}
      <div className="container advisor-workspace-grid">
        {/* Left Form: Vehicle Diagnostic Input */}
        <div className="advisor-input-card">
          <div className="card-top-head">
            <h2 className="card-top-title">Calibrate Your Vehicle Requirements</h2>
            <p className="card-top-sub">Define your parameters for an unfiltered comparative dossier.</p>
          </div>

          <form className="diagnostic-form" onSubmit={handleGenerate}>
            {/* Budget & Condition */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Budget Tier</label>
                <select
                  className="input"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="Under ₹6L">Under ₹6 Lakhs (Beaters / First Cars)</option>
                  <option value="₹6L - ₹12L">₹6L - ₹12 Lakhs (Hatchbacks & Compacts)</option>
                  <option value="₹12L - ₹20L">₹12L - ₹20 Lakhs (Family Sedans / Mid-SUVs)</option>
                  <option value="₹20L - ₹35L">₹20L - ₹35 Lakhs (Executive / 4x4 / Hot Sedans)</option>
                  <option value="₹35L - ₹75L">₹35L - ₹75 Lakhs (Luxury German / Superbikes)</option>
                  <option value="₹75L+">₹75 Lakhs+ (Performance / Sports Cars)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Condition Preference</label>
                <select
                  className="input"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="New or Used">Open to Both (New & Pre-Owned)</option>
                  <option value="Brand New Showroom Only">Brand New Showroom Only</option>
                  <option value="Pre-Owned / Used Only">Pre-Owned / Used Only (Max Value)</option>
                </select>
              </div>
            </div>

            {/* City & Usage */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">City / RTO Region</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Mumbai, Bangalore, Delhi-NCR, Pune"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Usage Pattern</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Daily Bumper-to-Bumper + Weekend Ghats"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                />
              </div>
            </div>

            {/* Buyer Priority Selectors */}
            <div className="form-group">
              <div className="priority-label-row">
                <label className="form-label">Select Your Top Priorities (Up to 4)</label>
                <span className="priority-count-tag">{priorities.length}/4 Selected</span>
              </div>
              <div className="priorities-pill-grid">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`priority-pill ${priorities.includes(opt) ? 'active' : ''}`}
                    onClick={() => togglePriority(opt)}
                  >
                    {priorities.includes(opt) && <span className="pill-check">{Icons.check}</span>}
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Shortlisted Contenders */}
            <div className="form-group">
              <label className="form-label">Shortlisted Contenders (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Virtus GT Plus vs Skoda Slavia vs Verna Turbo"
                value={contenders}
                onChange={(e) => setContenders(e.target.value)}
              />
            </div>

            {/* Specific Dilemmas / Notes */}
            <div className="form-group">
              <label className="form-label">Specific Dilemmas / Test-Drive Questions</label>
              <textarea
                rows={2}
                className="input"
                placeholder="e.g. Concerned about DSG automatic reliability in heavy city traffic; ride comfort for elderly parents over unscientific speed breakers."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary generate-dossier-btn"
              disabled={loading}
            >
              {loading ? 'Synthesizing Automotive Dossier...' : 'Generate Unbiased Advisory Dossier'}
            </button>
          </form>
        </div>

        {/* Right Column: Output Display or Welcome Pitch */}
        <div className="advisor-output-col" id="advisory-results-view">
          {analysis ? (
            <div className="dossier-results-box">
              <div className="dossier-results-header">
                <span className="dossier-tag">UNFILTERED DOSSIER</span>
                <h3 className="dossier-title">{analysis.summary_title}</h3>
                <span className="dossier-meta-budget">Budget Tier: {analysis.budget_tier}</span>
              </div>

              <div className="dossier-rendered-content">
                {analysis.analysis_markdown.split('\n\n').map((block, i) => {
                  if (block.startsWith('### ')) {
                    return <h3 key={i} className="md-heading">{block.replace('### ', '')}</h3>;
                  }
                  if (block.startsWith('* ') || block.startsWith('1. ') || block.startsWith('2. ') || block.startsWith('3. ') || block.startsWith('4. ')) {
                    return (
                      <div key={i} className="md-list-block">
                        {block.split('\n').map((line, j) => (
                          <div key={j} className="md-list-item">
                            <span className="md-bullet">•</span>
                            <span>{line.replace(/^(\* |\d+\. )/, '')}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (block === '---') {
                    return <hr key={i} className="md-divider" />;
                  }
                  return <p key={i} className="md-para">{block}</p>;
                })}
              </div>

              {/* Pitch to 1-on-1 Paid Consultation */}
              <div className="dossier-consult-callout">
                <div className="callout-text-wrap">
                  <h4 className="callout-title">Need a Human Expert to Double-Check Your Decision?</h4>
                  <p className="callout-desc">
                    Book a 1-on-1 strategy call with our founder to audit dealer discount sheets, vet used inspection logs, or negotiate on your behalf.
                  </p>
                </div>
                <div className="callout-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedConsultTier({
                      id: 'strategy_call',
                      title: '1-on-1 Strategy & Shortlist Video Call',
                      price: 2999
                    })}
                  >
                    Book 1-on-1 Call (Rs 2,999)
                  </button>
                  <Link to="/consulting" className="btn btn-secondary btn-sm">
                    View All Consulting Tiers
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="advisor-welcome-box">
              <div className="welcome-shield-icon">{Icons.shield}</div>
              <h3 className="welcome-title">Independent Automotive Authority</h3>
              <p className="welcome-desc">
                Select a scenario above or enter your parameters on the left to receive a comprehensive, unvarnished comparative analysis tailored to your driving reality in India.
              </p>

              <div className="advisory-pillars-card">
                <div className="pillar-row">
                  <span className="pillar-num">01</span>
                  <span className="pillar-text"><strong>Priority-Calibrated:</strong> Balances safety, low-speed ride comfort, and maintenance against raw horsepower.</span>
                </div>
                <div className="pillar-row">
                  <span className="pillar-num">02</span>
                  <span className="pillar-text"><strong>Real Ownership Costs:</strong> Real-world city mileage, periodic service bills, and known mechanical flaws.</span>
                </div>
                <div className="pillar-row">
                  <span className="pillar-num">03</span>
                  <span className="pillar-text"><strong>Zero Brand Bias:</strong> We have no dealer affiliations or manufacturer advertising constraints.</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
