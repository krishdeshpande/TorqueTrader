import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { createListing } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import './CreateListing.css';

const ENGINES  = ['Inline-4','V-Twin','L-Twin','Triple','Boxer','Other'];
const BODYTYPES = ['Supersport','Naked','ADV','Cruiser','Modern Classic'];

const EMPTY = {
  make:'', model:'', year: new Date().getFullYear(),
  price:'', odometer:'', engine_config:'Inline-4',
  body_type:'Supersport', bhp:'', location:'', description:'',
};

export default function CreateListing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  if (authLoading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        year:      Number(form.year),
        price:     Number(form.price),
        odometer:  Number(form.odometer),
        bhp:       Number(form.bhp),
      };
      await createListing(payload);
      toast.success('Listing created! It is now in DRAFT — an admin will review it.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail?.[0]?.msg || 'Failed to create listing');
    } finally { setLoading(false); }
  };

  return (
    <div className="create-page">
      <div className="container create-container">
        <div className="create-header">
          <h1 className="page-title">List Your Superbike</h1>
          <p className="page-subtitle">Fill in the details — takes under 2 minutes</p>
        </div>

        {/* Step indicator */}
        <div className="steps">
          {['Basic Info', 'Specifications', 'Review'].map((s, i) => (
            <div key={s} className={`step-item ${step > i+1 ? 'done' : ''} ${step === i+1 ? 'active' : ''}`}>
              <div className="step-circle">{step > i+1 ? '✓' : i+1}</div>
              <span className="step-label">{s}</span>
              {i < 2 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="create-form card">
          {step === 1 && (
            <div className="form-step">
              <h2 className="step-title">Basic Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Make *</label>
                  <input id="cl-make" className="input" placeholder="e.g. Ducati" value={form.make} onChange={e => set('make', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Model *</label>
                  <input id="cl-model" className="input" placeholder="e.g. Panigale V4" value={form.model} onChange={e => set('model', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <input id="cl-year" className="input" type="number" min="1990" max={new Date().getFullYear()} value={form.year} onChange={e => set('year', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input id="cl-price" className="input" type="number" placeholder="2500000" value={form.price} onChange={e => set('price', e.target.value)} required />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Location *</label>
                  <input id="cl-location" className="input" placeholder="e.g. Mumbai, Maharashtra" value={form.location} onChange={e => set('location', e.target.value)} required />
                </div>
              </div>
              <div className="step-nav">
                <span />
                <button className="btn btn-primary" id="cl-next-1"
                  disabled={!form.make || !form.model || !form.price || !form.location}
                  onClick={() => setStep(2)}>Next →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2 className="step-title">Technical Specifications</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Engine Configuration *</label>
                  <select id="cl-engine" className="input" value={form.engine_config} onChange={e => set('engine_config', e.target.value)}>
                    {ENGINES.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Body Type *</label>
                  <select id="cl-body" className="input" value={form.body_type} onChange={e => set('body_type', e.target.value)}>
                    {BODYTYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Power (BHP) *</label>
                  <input id="cl-bhp" className="input" type="number" placeholder="215" value={form.bhp} onChange={e => set('bhp', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Odometer (km) *</label>
                  <input id="cl-odometer" className="input" type="number" placeholder="8500" value={form.odometer} onChange={e => set('odometer', e.target.value)} required />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Description (optional)</label>
                  <textarea id="cl-desc" className="input" rows={3} placeholder="Any additional details about the bike's condition…" value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
              </div>
              <div className="step-nav">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" id="cl-next-2"
                  disabled={!form.bhp || !form.odometer}
                  onClick={() => setStep(3)}>Review →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2 className="step-title">Review Your Listing</h2>
              <div className="review-grid">
                {[
                  ['Make',    form.make],   ['Model', form.model],
                  ['Year',    form.year],   ['Price', `₹${Number(form.price).toLocaleString('en-IN')}`],
                  ['Engine',  form.engine_config], ['Body',  form.body_type],
                  ['Power',   `${form.bhp} BHP`],  ['Odometer', `${Number(form.odometer).toLocaleString()} km`],
                  ['Location', form.location],
                ].map(([k, v]) => (
                  <div key={k} className="review-item">
                    <span className="review-key">{k}</span>
                    <span className="review-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="review-notice">
                ℹ️ Your listing will be submitted in <strong>DRAFT</strong> status and reviewed by our team before going live.
              </div>
              <div className="step-nav">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Edit</button>
                <button className="btn btn-primary" id="cl-submit-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting…' : '🚀 Submit Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
