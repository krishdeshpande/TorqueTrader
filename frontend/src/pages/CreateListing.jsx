import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createListing, rcLookup, uploadBikePhoto } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { Icons } from '../components/Icons';
import AuthModal from '../components/AuthModal';
import './CreateListing.css';

const ENGINES = ['Inline-4', 'V-Twin', 'Triple', 'Boxer', 'Other'];
const BODY_TYPES = ['Supersport', 'Naked', 'ADV', 'Cruiser', 'Modern Classic'];
const STEPS = [
  { id: 0, title: 'RC Autofill & Basics' },
  { id: 1, title: 'Technical Specs' },
  { id: 2, title: 'Condition & Mods' },
  { id: 3, title: 'Photos & Review' },
];

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rcLoading, setRcLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Form State
  const [form, setForm] = useState({
    reg_number: '',
    rto_state: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    odometer: '',
    engine_config: 'Inline-4',
    body_type: 'Supersport',
    displacement_cc: '',
    bhp: '',
    torque_nm: '',
    transmission: '6-speed with Quickshifter',
    location: '',
    ownership_count: 1,
    insurance_type: 'Comprehensive Zero Depreciation',
    insurance_valid_until: '',
    hypothecation_status: 'No Hypothecation (Clean NOC Available)',
    tyre_condition_pct: 85,
    tyre_dot_year: 2023,
    chain_sprocket_health: 'Good Condition (Cleaned & Lubed)',
    keys_count: 2,
    service_history_type: 'Complete Authorized Dealership Records',
    exhaust_type: 'Stock OEM Exhaust',
    modificationsText: '',
    flawsText: '',
    description: '',
    images: {
      hero: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
      walkaround: [
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=80',
      ],
      cockpit: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'],
      mechanicals: ['https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=1200&q=80'],
      flaws: [],
    },
  });

  const [errors, setErrors] = useState({});

  // Auto prefill if passed from homepage RC decoder
  useEffect(() => {
    if (locationState.state?.prefillRC) {
      applyRcData(locationState.state.prefillRC);
    }
  }, [locationState.state]);

  const applyRcData = (data) => {
    setForm((prev) => ({
      ...prev,
      reg_number: data.reg_number || prev.reg_number,
      rto_state: data.rto_location || prev.rto_state,
      make: data.make || prev.make,
      model: data.model || prev.model,
      year: data.year || prev.year,
      engine_config: data.engine_config || prev.engine_config,
      body_type: data.body_type || prev.body_type,
      displacement_cc: data.displacement_cc || prev.displacement_cc,
      bhp: data.bhp || prev.bhp,
      torque_nm: data.torque_nm || prev.torque_nm,
      transmission: data.transmission || prev.transmission,
      ownership_count: data.ownership_serial || prev.ownership_count,
      insurance_valid_until: data.insurance_valid_until || prev.insurance_valid_until,
      insurance_type: data.insurance_type || prev.insurance_type,
      hypothecation_status: data.hypothecation_status || prev.hypothecation_status,
      price: prev.price || data.suggested_price_min || '',
    }));
    toast.success(`mParivahan RC record verified: ${data.make} ${data.model} (${data.rto_location})`);
  };

  const handleFetchRC = async () => {
    if (!form.reg_number.trim()) {
      toast.error('Please enter an Indian registration plate number (e.g. MH02DW1234).');
      return;
    }
    setRcLoading(true);
    try {
      const data = await rcLookup(form.reg_number);
      applyRcData(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not verify RC with VAHAN. You can proceed with manual entry.');
    } finally {
      setRcLoading(false);
    }
  };

  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateCurrentStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.make) errs.make = 'Manufacturer is required';
      if (!form.model) errs.model = 'Model designation is required';
      if (!form.year) errs.year = 'Model year is required';
      if (!form.location) errs.location = 'Location (City, State) is required';
    } else if (step === 1) {
      if (!form.displacement_cc) errs.displacement_cc = 'Displacement CC is required';
      if (!form.bhp) errs.bhp = 'Power output in BHP is required';
      if (!form.odometer) errs.odometer = 'Odometer reading is required';
    } else if (step === 2) {
      if (!form.price || Number(form.price) <= 0) errs.price = 'Valid asking price is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo(0, 0);
  };

  const handleSubmitListing = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        price: Number(form.price),
        odometer: Number(form.odometer),
        bhp: Number(form.bhp),
        displacement_cc: Number(form.displacement_cc),
        torque_nm: Number(form.torque_nm || 0),
        ownership_count: Number(form.ownership_count),
        modifications: form.modificationsText ? form.modificationsText.split('\n').filter(Boolean) : [],
        flaws: form.flawsText ? form.flawsText.split('\n').filter(Boolean) : [],
      };

      await createListing(payload);
      toast.success('Superbike listing submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit listing. Please verify required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-root">
      <div className="container create-layout">
        {/* Progress Header */}
        <div className="create-header-block">
          <span className="create-eyebrow">SELLER ONBOARDING</span>
          <h1 className="create-main-title">List Your High-Performance Motorcycle</h1>
          <p className="create-subtext">
            Standardized superbike dossier with mParivahan RC auto-population.
          </p>

          {/* Stepper Progress Tabs */}
          <div className="stepper-progress-bar">
            {STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`stepper-step ${idx < step ? 'completed' : ''} ${idx === step ? 'active' : ''}`}
                onClick={() => { if (idx < step) setStep(idx); }}
              >
                <div className="stepper-index">
                  {idx < step ? Icons.check : `0${idx + 1}`}
                </div>
                <span className="stepper-title">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Step Form Card */}
        <div className="create-form-card">
          {/* ── Step 0: RC Plate & Basics ──────────────────────────────────── */}
          {step === 0 && (
            <div className="form-section-block">
              <div className="rc-autofill-banner">
                <div className="rc-banner-head">
                  <span className="rc-banner-tag">VAHAN / mParivahan Integration</span>
                  <h3 className="rc-banner-title">Instant Registration Plate Lookup</h3>
                </div>
                <p className="rc-banner-desc">
                  Enter your motorcycle's registration number (e.g. MH02DW1234, DL03CY5678, KA01EA7788) to automatically populate factory specifications, registration date, and ownership count.
                </p>

                <div className="rc-inline-search">
                  <input
                    type="text"
                    className="rc-plate-field"
                    placeholder="ENTER RTO NUMBER (e.g. MH02DW1234)"
                    value={form.reg_number}
                    onChange={(e) => setField('reg_number', e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="btn btn-primary rc-fetch-btn"
                    onClick={handleFetchRC}
                    disabled={rcLoading || !form.reg_number.trim()}
                  >
                    {rcLoading ? 'Querying VAHAN...' : 'Fetch RC Details'}
                  </button>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-make">Manufacturer / Make *</label>
                  <input
                    id="f-make"
                    type="text"
                    className="input"
                    placeholder="e.g. Ducati, BMW, Kawasaki, Triumph"
                    value={form.make}
                    onChange={(e) => setField('make', e.target.value)}
                  />
                  {errors.make && <span className="field-error">{errors.make}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-model">Model & Variant Designation *</label>
                  <input
                    id="f-model"
                    type="text"
                    className="input"
                    placeholder="e.g. Panigale V4 S, S1000RR M-Sport"
                    value={form.model}
                    onChange={(e) => setField('model', e.target.value)}
                  />
                  {errors.model && <span className="field-error">{errors.model}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-year">Model Year *</label>
                  <input
                    id="f-year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="input"
                    value={form.year}
                    onChange={(e) => setField('year', e.target.value)}
                  />
                  {errors.year && <span className="field-error">{errors.year}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-rto">RTO Registration Jurisdiction</label>
                  <input
                    id="f-rto"
                    type="text"
                    className="input"
                    placeholder="e.g. MH02 (Mumbai West), DL03 (South Delhi)"
                    value={form.rto_state}
                    onChange={(e) => setField('rto_state', e.target.value)}
                  />
                </div>

                <div className="form-group full-col">
                  <label className="form-label" htmlFor="f-loc">Location (City, Area, State) *</label>
                  <input
                    id="f-loc"
                    type="text"
                    className="input"
                    placeholder="e.g. Bandra West, Mumbai, Maharashtra"
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                  />
                  {errors.location && <span className="field-error">{errors.location}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Technical Specifications ───────────────────────────── */}
          {step === 1 && (
            <div className="form-section-block">
              <h2 className="step-section-heading">Powertrain & Mechanical Specifications</h2>
              <p className="step-section-sub">Detailed engineering parameters for enthusiast buyers.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Engine Cylinder Layout *</label>
                  <select
                    className="input"
                    value={form.engine_config}
                    onChange={(e) => setField('engine_config', e.target.value)}
                  >
                    {ENGINES.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Body Style *</label>
                  <select
                    className="input"
                    value={form.body_type}
                    onChange={(e) => setField('body_type', e.target.value)}
                  >
                    {BODY_TYPES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-cc">Displacement (CC) *</label>
                  <input
                    id="f-cc"
                    type="number"
                    className="input"
                    placeholder="e.g. 1103"
                    value={form.displacement_cc}
                    onChange={(e) => setField('displacement_cc', e.target.value)}
                  />
                  {errors.displacement_cc && <span className="field-error">{errors.displacement_cc}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-bhp">Peak Power (BHP) *</label>
                  <input
                    id="f-bhp"
                    type="number"
                    step="0.1"
                    className="input"
                    placeholder="e.g. 215.5"
                    value={form.bhp}
                    onChange={(e) => setField('bhp', e.target.value)}
                  />
                  {errors.bhp && <span className="field-error">{errors.bhp}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-torque">Peak Torque (Nm)</label>
                  <input
                    id="f-torque"
                    type="number"
                    step="0.1"
                    className="input"
                    placeholder="e.g. 123.6"
                    value={form.torque_nm}
                    onChange={(e) => setField('torque_nm', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="f-odo">Current Odometer Reading (KM) *</label>
                  <input
                    id="f-odo"
                    type="number"
                    className="input"
                    placeholder="e.g. 4200"
                    value={form.odometer}
                    onChange={(e) => setField('odometer', e.target.value)}
                  />
                  {errors.odometer && <span className="field-error">{errors.odometer}</span>}
                </div>

                <div className="form-group full-col">
                  <label className="form-label" htmlFor="f-trans">Transmission & Quickshifter Suite</label>
                  <input
                    id="f-trans"
                    type="text"
                    className="input"
                    placeholder="e.g. 6-speed with Bi-directional Quickshifter (DQS / KQS)"
                    value={form.transmission}
                    onChange={(e) => setField('transmission', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Condition, Ownership, Modifications & Flaws ────────── */}
          {step === 2 && (
            <div className="form-section-block">
              <h2 className="step-section-heading">Condition, Ownership & Transparency</h2>
              <p className="step-section-sub">Disclose all wear items and installed aftermarket upgrades.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-price">Fixed Asking Price (Rs) *</label>
                  <input
                    id="f-price"
                    type="number"
                    className="input"
                    placeholder="e.g. 2850000"
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                  />
                  {errors.price && <span className="field-error">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Ownership Serial Count *</label>
                  <select
                    className="input"
                    value={form.ownership_count}
                    onChange={(e) => setField('ownership_count', Number(e.target.value))}
                  >
                    <option value={1}>1st Owner (Single Owner from New)</option>
                    <option value={2}>2nd Owner</option>
                    <option value={3}>3rd Owner</option>
                    <option value={4}>4th+ Owner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Installed Exhaust System</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Akrapovic Full Titanium / Stock Factory"
                    value={form.exhaust_type}
                    onChange={(e) => setField('exhaust_type', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tyre Tread Health (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    className="input"
                    placeholder="e.g. 85"
                    value={form.tyre_condition_pct}
                    onChange={(e) => setField('tyre_condition_pct', e.target.value)}
                  />
                </div>

                <div className="form-group full-col">
                  <label className="form-label">Installed Modifications (One per line)</label>
                  <textarea
                    rows={3}
                    className="input"
                    placeholder="e.g.&#10;Akrapovic Titanium Full System (+12 HP)&#10;Evotech Radiator Guard&#10;GB Racing Engine Case Protectors"
                    value={form.modificationsText}
                    onChange={(e) => setField('modificationsText', e.target.value)}
                  />
                </div>

                <div className="form-group full-col">
                  <label className="form-label">Known Imperfections & Flaws (Transparent Disclosure)</label>
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="e.g. Minor 3mm stone chip on lower fairing; light boot rub mark on right heel guard."
                    value={form.flawsText}
                    onChange={(e) => setField('flawsText', e.target.value)}
                  />
                </div>

                <div className="form-group full-col">
                  <label className="form-label">Seller Notes & Garage History</label>
                  <textarea
                    rows={3}
                    className="input"
                    placeholder="Share any special context: storage environment, track day history, break-in procedure, or warranty details."
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Photos & Final Review ──────────────────────────────── */}
          {step === 3 && (
            <div className="form-section-block">
              <h2 className="step-section-heading">Listing Dossier Review</h2>
              <p className="step-section-sub">Verify all parameters prior to publishing onto the live index.</p>

              {/* Review Matrix */}
              <div className="review-matrix-card">
                <div className="review-row">
                  <span className="review-k">Motorcycle</span>
                  <span className="review-v">{form.year} {form.make} {form.model}</span>
                </div>
                <div className="review-row">
                  <span className="review-k">Registration</span>
                  <span className="review-v">{form.reg_number || 'Clean Verified'} ({form.rto_state || form.location})</span>
                </div>
                <div className="review-row">
                  <span className="review-k">Asking Price</span>
                  <span className="review-v highlight">Rs {Number(form.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="review-row">
                  <span className="review-k">Odometer</span>
                  <span className="review-v">{Number(form.odometer).toLocaleString('en-IN')} km</span>
                </div>
                <div className="review-row">
                  <span className="review-k">Powertrain</span>
                  <span className="review-v">{form.displacement_cc}cc · {form.bhp} BHP · {form.engine_config}</span>
                </div>
                <div className="review-row">
                  <span className="review-k">Ownership</span>
                  <span className="review-v">{form.ownership_count === 1 ? '1st Owner' : `${form.ownership_count} Owners`}</span>
                </div>
                <div className="review-row">
                  <span className="review-k">Exhaust</span>
                  <span className="review-v">{form.exhaust_type || 'Stock OEM'}</span>
                </div>
              </div>

              {/* Photos status notice */}
              <div className="photo-review-notice">
                <div className="photo-notice-head">
                  <span className="notice-icon">{Icons.camera}</span>
                  <span className="notice-title">High-Resolution Studio & Walkaround Media</span>
                </div>
                <p className="notice-desc">
                  Default verified gallery templates loaded. You can attach additional high-res photos anytime from your seller dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="stepper-actions-footer">
            {step > 0 ? (
              <button type="button" className="btn btn-secondary" onClick={prevStep}>
                {Icons.arrowLeft} Previous Step
              </button>
            ) : <span />}

            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                Continue to {STEPS[step + 1].title} {Icons.arrowRight}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitListing}
                disabled={loading}
              >
                {loading ? 'Publishing Dossier...' : 'Publish Superbike Listing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
