import { useState, useEffect, useRef } from 'react';
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

const compressImageFile = (file, maxWidth = 1200, quality = 0.78) => {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rcLoading, setRcLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Photo Upload States
  const [photoCategory, setPhotoCategory] = useState('walkaround');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef(null);

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

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

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

  // Photo Handlers
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const compressedList = await Promise.all(files.map((f) => compressImageFile(f)));
      const validUrls = compressedList.filter(Boolean);
      if (!validUrls.length) {
        toast.error('Could not process selected image files.');
        return;
      }

      setForm((prev) => {
        const updated = { ...prev.images };
        if (photoCategory === 'hero') {
          updated.hero = validUrls[0];
          if (validUrls.length > 1) {
            updated.walkaround = [...(updated.walkaround || []), ...validUrls.slice(1)];
          }
        } else {
          const currentList = updated[photoCategory] || [];
          updated[photoCategory] = [...currentList, ...validUrls];
        }
        return { ...prev, images: updated };
      });

      toast.success(`${validUrls.length} photo${validUrls.length > 1 ? 's' : ''} optimized & added to gallery!`);
    } catch (err) {
      console.error('Photo optimization error:', err);
      toast.error('Failed to process image files.');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    if (!customPhotoUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }
    const url = customPhotoUrl.trim();
    setForm((prev) => {
      const updated = { ...prev.images };
      if (photoCategory === 'hero') {
        updated.hero = url;
      } else {
        const currentList = updated[photoCategory] || [];
        updated[photoCategory] = [...currentList, url];
      }
      return { ...prev, images: updated };
    });
    setCustomPhotoUrl('');
    toast.success('Photo URL added to gallery!');
  };

  const handleSetHeroPhoto = (url) => {
    setForm((prev) => ({
      ...prev,
      images: { ...prev.images, hero: url },
    }));
    toast.success('Main cover photo updated!');
  };

  const handleRemovePhoto = (category, index) => {
    setForm((prev) => {
      const updated = { ...prev.images };
      if (category === 'hero') {
        const fallback = updated.walkaround?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80';
        updated.hero = fallback;
      } else {
        const list = [...(updated[category] || [])];
        list.splice(index, 1);
        updated[category] = list;
      }
      return { ...prev, images: updated };
    });
    toast.info('Photo removed from listing.');
  };

  const handleLoadSamplePhotos = () => {
    setForm((prev) => ({
      ...prev,
      images: {
        hero: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1600&q=80',
        walkaround: [
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
        ],
        cockpit: [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
        ],
        mechanicals: [
          'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=1200&q=80',
        ],
        flaws: [],
      },
    }));
    toast.success('Loaded high-resolution superbike studio sample photography!');
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
      toast.info('Please sign in with your email to publish your listing to the live marketplace.');
      setShowAuth(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        price: Number(form.price),
        odometer: Number(form.odometer || 0),
        bhp: Number(form.bhp || 100),
        displacement_cc: form.displacement_cc ? Number(form.displacement_cc) : null,
        torque_nm: form.torque_nm ? Number(form.torque_nm) : null,
        ownership_count: Number(form.ownership_count || 1),
        engine_config: form.engine_config || 'Inline-4',
        body_type: form.body_type || 'Supersport',
        location: form.location.trim(),
        reg_number: form.reg_number ? form.reg_number.trim().toUpperCase() : null,
        rto_state: form.rto_state ? form.rto_state.trim() : null,
        transmission: form.transmission || null,
        seat_height_mm: form.seat_height_mm ? Number(form.seat_height_mm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        exhaust_type: form.exhaust_type || null,
        tyre_condition_pct: Number(form.tyre_condition_pct || 85),
        tyre_dot_year: Number(form.tyre_dot_year || 2023),
        chain_sprocket_health: form.chain_sprocket_health || null,
        keys_count: Number(form.keys_count || 2),
        service_history_type: form.service_history_type || null,
        insurance_type: form.insurance_type || null,
        insurance_valid_until: form.insurance_valid_until || null,
        hypothecation_status: form.hypothecation_status || null,
        modifications: form.modificationsText ? form.modificationsText.split('\n').map(s => s.trim()).filter(Boolean) : [],
        flaws: form.flawsText ? form.flawsText.split('\n').map(s => s.trim()).filter(Boolean) : [],
        description: form.description ? form.description.trim() : null,
        images: form.images || {
          hero: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
          walkaround: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80'],
          cockpit: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'],
          mechanicals: ['https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=1200&q=80'],
          flaws: [],
        },
        media_gallery: form.images?.walkaround?.map(url => ({ type: 'walkaround', url })) || []
      };

      await createListing(payload);
      toast.success('Superbike listed & published to the catalogue successfully!');
      navigate('/listings');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to submit listing. Please verify required fields.');
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
              <h2 className="step-section-heading">High-Resolution Photography & Media</h2>
              <p className="step-section-sub">
                Upload authentic photography of your motorcycle. Clear, high-res photos significantly increase buyer trust and inquiry rates.
              </p>

              {/* ── Photo Management Suite ────────────────────────────────────── */}
              <div className="photo-upload-suite-card">
                {/* Category Selector Tabs */}
                <div className="photo-category-tabs">
                  {[
                    { key: 'hero', label: '⭐ Cover Photo (Hero)' },
                    { key: 'walkaround', label: 'Walkaround & Angles' },
                    { key: 'cockpit', label: 'Cockpit & Odometer' },
                    { key: 'mechanicals', label: 'Engine & Mechanicals' },
                    { key: 'flaws', label: 'Imperfections & Flaws' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      className={`photo-cat-btn ${photoCategory === cat.key ? 'active' : ''}`}
                      onClick={() => setPhotoCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Upload Action Box */}
                <div className="photo-uploader-box">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  <div className="uploader-content">
                    <div className="uploader-icon-wrap">
                      {Icons.camera}
                    </div>
                    <div className="uploader-text">
                      <h4>Attach Photos to: <span className="cat-highlight">{photoCategory.toUpperCase()}</span></h4>
                      <p>Supports high-res JPG, PNG, WEBP from your phone or computer.</p>
                    </div>

                    <div className="uploader-action-btns">
                      <button
                        type="button"
                        className="btn btn-primary photo-select-btn"
                        onClick={handleTriggerFileInput}
                        disabled={uploadingPhotos}
                      >
                        {Icons.upload} {uploadingPhotos ? 'Reading Photos...' : 'Choose Photos from Device'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary photo-sample-btn"
                        onClick={handleLoadSamplePhotos}
                      >
                        Load Studio Sample Pack
                      </button>
                    </div>
                  </div>

                  {/* URL Input Option */}
                  <div className="photo-url-input-row">
                    <input
                      type="url"
                      className="photo-url-field"
                      placeholder="Or paste high-res image URL (e.g. https://images.unsplash.com/...)"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhotoUrl(); } }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary photo-add-url-btn"
                      onClick={handleAddPhotoUrl}
                    >
                      {Icons.plus} Add URL
                    </button>
                  </div>
                </div>

                {/* ── Attached Photos Live Grid ───────────────────────────────── */}
                <div className="attached-gallery-section">
                  <div className="gallery-header-row">
                    <span className="gallery-title">Attached Media Gallery</span>
                    <span className="gallery-count-tag">
                      {1 + (form.images.walkaround?.length || 0) + (form.images.cockpit?.length || 0) + (form.images.mechanicals?.length || 0) + (form.images.flaws?.length || 0)} Photos Attached
                    </span>
                  </div>

                  <div className="attached-photos-grid">
                    {/* Hero Photo Card */}
                    {form.images?.hero && (
                      <div className="attached-photo-card is-hero">
                        <img src={form.images.hero} alt="Cover Preview" className="photo-thumb-img" />
                        <div className="photo-role-badge hero-badge">⭐ MAIN COVER</div>
                        <div className="photo-card-actions">
                          <button
                            type="button"
                            className="photo-action-btn delete-btn"
                            onClick={() => handleRemovePhoto('hero', 0)}
                            title="Reset cover photo"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Walkaround Photos */}
                    {(form.images.walkaround || []).map((url, idx) => (
                      <div key={`walkaround-${idx}`} className="attached-photo-card">
                        <img src={url} alt={`Walkaround ${idx + 1}`} className="photo-thumb-img" />
                        <div className="photo-role-badge">Walkaround</div>
                        <div className="photo-card-actions">
                          <button
                            type="button"
                            className="photo-action-btn set-hero-btn"
                            onClick={() => handleSetHeroPhoto(url)}
                            title="Set as Main Cover Photo"
                          >
                            Make Cover
                          </button>
                          <button
                            type="button"
                            className="photo-action-btn delete-btn"
                            onClick={() => handleRemovePhoto('walkaround', idx)}
                            title="Delete photo"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Cockpit Photos */}
                    {(form.images.cockpit || []).map((url, idx) => (
                      <div key={`cockpit-${idx}`} className="attached-photo-card">
                        <img src={url} alt={`Cockpit ${idx + 1}`} className="photo-thumb-img" />
                        <div className="photo-role-badge">Cockpit & Odo</div>
                        <div className="photo-card-actions">
                          <button
                            type="button"
                            className="photo-action-btn set-hero-btn"
                            onClick={() => handleSetHeroPhoto(url)}
                            title="Set as Main Cover Photo"
                          >
                            Make Cover
                          </button>
                          <button
                            type="button"
                            className="photo-action-btn delete-btn"
                            onClick={() => handleRemovePhoto('cockpit', idx)}
                            title="Delete photo"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Mechanicals Photos */}
                    {(form.images.mechanicals || []).map((url, idx) => (
                      <div key={`mechanicals-${idx}`} className="attached-photo-card">
                        <img src={url} alt={`Mechanicals ${idx + 1}`} className="photo-thumb-img" />
                        <div className="photo-role-badge">Mechanicals</div>
                        <div className="photo-card-actions">
                          <button
                            type="button"
                            className="photo-action-btn set-hero-btn"
                            onClick={() => handleSetHeroPhoto(url)}
                            title="Set as Main Cover Photo"
                          >
                            Make Cover
                          </button>
                          <button
                            type="button"
                            className="photo-action-btn delete-btn"
                            onClick={() => handleRemovePhoto('mechanicals', idx)}
                            title="Delete photo"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Flaws Photos */}
                    {(form.images.flaws || []).map((url, idx) => (
                      <div key={`flaws-${idx}`} className="attached-photo-card">
                        <img src={url} alt={`Flaw ${idx + 1}`} className="photo-thumb-img" />
                        <div className="photo-role-badge flaw-badge">Flaw / Mark</div>
                        <div className="photo-card-actions">
                          <button
                            type="button"
                            className="photo-action-btn delete-btn"
                            onClick={() => handleRemovePhoto('flaws', idx)}
                            title="Delete photo"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Specification Summary Matrix ────────────────────────────── */}
              <h3 className="matrix-heading-title" style={{ marginTop: 32, marginBottom: 12 }}>
                Final Verification Matrix
              </h3>
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
