import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { createListing } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { Icons } from '../components/Icons';
import './CreateListing.css';

const ENGINES   = ['Inline-4','V-Twin','L-Twin','Triple','Boxer','Other'];
const BODYTYPES = ['Supersport','Naked','ADV','Cruiser','Modern Classic'];
const STEPS     = ['Basic Info', 'Specifications', 'Review & Submit'];

const EMPTY = {
  make:'', model:'', year: new Date().getFullYear(),
  price:'', odometer:'', engine_config:'Inline-4',
  body_type:'Supersport', bhp:'', location:'', description:'',
};

export default function CreateListing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0); // 0-indexed
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  if (authLoading) return null;
  if (!user) return <Navigate to="/" replace />;

  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setErrors(e => ({...e, [k]: ''})); };

  const validateStep0 = () => {
    const e = {};
    if (!form.make)     e.make     = 'Make is required';
    if (!form.model)    e.model    = 'Model is required';
    if (!form.price)    e.price    = 'Price is required';
    if (!form.location) e.location = 'Location is required';
    if (!form.year || form.year < 1990 || form.year > new Date().getFullYear())
                        e.year     = 'Enter a valid year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.bhp)      e.bhp      = 'BHP is required';
    if (!form.odometer) e.odometer = 'Odometer reading is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createListing({
        ...form,
        year: Number(form.year), price: Number(form.price),
        odometer: Number(form.odometer), bhp: Number(form.bhp),
      });
      toast.success('Listing submitted! Our team will review it shortly.');
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
      toast.error(msg || 'Failed to create listing');
    } finally { setLoading(false); }
  };

  const progress = ((step) / STEPS.length) * 100;

  return (
    <div className="create-page">
      <div className="container create-container">
        {/* Header */}
        <div className="create-top">
          <div>
            <h1 className="page-title">List Your Superbike</h1>
            <p className="page-sub">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Step labels */}
        <div className="step-labels">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-lbl ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
              <div className="step-lbl-dot">
                {i < step ? Icons.check : <span>{i + 1}</span>}
              </div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="create-card card">
          {/* ── Step 0: Basic Info ── */}
          {step === 0 && (
            <div className="form-step">
              <h2 className="step-heading">Basic Information</h2>
              <div className="form-grid-2">
                <Field label="Make" error={errors.make} required>
                  <input id="cl-make" className="input" placeholder="e.g. Ducati" value={form.make} onChange={e => set('make', e.target.value)} />
                </Field>
                <Field label="Model" error={errors.model} required>
                  <input id="cl-model" className="input" placeholder="e.g. Panigale V4" value={form.model} onChange={e => set('model', e.target.value)} />
                </Field>
                <Field label="Year" error={errors.year} required>
                  <input id="cl-year" className="input" type="number" min="1990" max={new Date().getFullYear()} value={form.year} onChange={e => set('year', e.target.value)} />
                </Field>
                <Field label="Asking Price (₹)" error={errors.price} required>
                  <input id="cl-price" className="input" type="number" placeholder="e.g. 2500000" value={form.price} onChange={e => set('price', e.target.value)} />
                </Field>
                <Field label="Location" error={errors.location} required full>
                  <input id="cl-location" className="input" placeholder="e.g. Mumbai, Maharashtra" value={form.location} onChange={e => set('location', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 1: Specs ── */}
          {step === 1 && (
            <div className="form-step">
              <h2 className="step-heading">Technical Specifications</h2>
              <div className="form-grid-2">
                <Field label="Engine Configuration" required>
                  <select id="cl-engine" className="input" value={form.engine_config} onChange={e => set('engine_config', e.target.value)}>
                    {ENGINES.map(e => <option key={e}>{e}</option>)}
                  </select>
                </Field>
                <Field label="Body Type" required>
                  <select id="cl-body" className="input" value={form.body_type} onChange={e => set('body_type', e.target.value)}>
                    {BODYTYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Power Output (BHP)" error={errors.bhp} required>
                  <input id="cl-bhp" className="input" type="number" placeholder="e.g. 215" value={form.bhp} onChange={e => set('bhp', e.target.value)} />
                </Field>
                <Field label="Odometer Reading (km)" error={errors.odometer} required>
                  <input id="cl-odometer" className="input" type="number" placeholder="e.g. 8500" value={form.odometer} onChange={e => set('odometer', e.target.value)} />
                </Field>
                <Field label="Description (optional)" full>
                  <textarea id="cl-desc" className="input" rows={4} placeholder="Share any additional details about the bike's condition, modifications, service history…" value={form.description} onChange={e => set('description', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && (
            <div className="form-step">
              <h2 className="step-heading">Review Your Listing</h2>
              <div className="review-table">
                {[
                  ['Make', form.make, 0],
                  ['Model', form.model, 0],
                  ['Year', form.year, 0],
                  ['Price', `₹${Number(form.price).toLocaleString('en-IN')}`, 0],
                  ['Location', form.location, 0],
                  ['Engine', form.engine_config, 1],
                  ['Body Type', form.body_type, 1],
                  ['Power', `${form.bhp} BHP`, 1],
                  ['Odometer', `${Number(form.odometer).toLocaleString()} km`, 1],
                ].map(([k, v, s]) => (
                  <div key={k} className="review-row">
                    <span className="review-key">{k}</span>
                    <span className="review-val">{v}</span>
                    <button className="review-edit" onClick={() => setStep(s)} title={`Edit ${k}`}>{Icons.edit}</button>
                  </div>
                ))}
              </div>
              {form.description && (
                <div className="review-desc">
                  <span className="review-key">Description</span>
                  <p>{form.description}</p>
                </div>
              )}
              <div className="review-notice">
                <strong>ℹ️ What happens next?</strong><br />
                Your listing will be submitted in <strong>Draft</strong> status. Our team reviews it within 24 hours before it goes live.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="step-nav">
            {step > 0 ? (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
            ) : <span />}
            {step < 2 ? (
              <button id={`cl-next-${step}`} className="btn btn-primary" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button id="cl-submit-btn" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting…' : '🚀 Submit Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Small helper component for consistent field rendering
function Field({ label, children, error, required, full }) {
  return (
    <div className={`form-group ${full ? 'full-width' : ''}`}>
      <label className="form-label">{label}{required && <span className="req">*</span>}</label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
