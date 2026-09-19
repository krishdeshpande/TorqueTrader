import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import './ProfileOnboarding.css';

const PREFERENCES = ['Sport', 'Naked', 'Superbike', 'Cruiser', 'ADV', 'Touring', 'Retro / Classic', 'Scrambler', 'Electric'];

export default function ProfileOnboarding() {
  const { user, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone_number: '', riding_experience: 'new',
    riding_duration_months: '', current_bikes: '', previous_bikes: '',
    bike_preferences: [], intent: 'browse', city: '', dream_bike: '',
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const togglePreference = (preference) => update(
    'bike_preferences',
    form.bike_preferences.includes(preference)
      ? form.bike_preferences.filter((item) => item !== preference)
      : [...form.bike_preferences, preference],
  );
  const list = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const nextStep = () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.phone_number.trim()) {
      toast.error('Please add your name and contact number to continue.');
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await completeProfile({
        ...form,
        riding_duration_months: form.riding_experience === 'experienced' && form.riding_duration_months
          ? Number(form.riding_duration_months)
          : null,
        current_bikes: list(form.current_bikes),
        previous_bikes: list(form.previous_bikes),
      });
      toast.success('Profile complete — welcome to TorqueTrader.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'We could not save your profile. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <p className="onboarding-eyebrow">ONE LAST STEP</p>
        <h1 id="onboarding-title">Build your rider profile</h1>
        <p className="onboarding-subtitle">A little context helps us create a more useful marketplace for you, {user?.email}.</p>

        <ol className="onboarding-progress" aria-label="Onboarding progress">
          {['About you', 'Your riding', 'Marketplace goals'].map((label, index) => (
            <li key={label} className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''}>
              <span>{index + 1}</span>{label}
            </li>
          ))}
        </ol>

        <form className="onboarding-form" onSubmit={submit}>
          {step === 1 && <section className="onboarding-step" aria-label="About you">
            <div className="onboarding-grid two-columns">
              <label>First name<input required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} /></label>
              <label>Last name<input required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} /></label>
            </div>
            <label>Mobile number<input required type="tel" placeholder="+91 98765 43210" value={form.phone_number} onChange={(e) => update('phone_number', e.target.value)} /></label>
          </section>}

          {step === 2 && <section className="onboarding-step" aria-label="Your riding">
            <fieldset>
              <legend>How would you describe your riding experience?</legend>
              <div className="onboarding-choice-row">
                <label className={form.riding_experience === 'new' ? 'selected' : ''}><input type="radio" name="experience" checked={form.riding_experience === 'new'} onChange={() => update('riding_experience', 'new')} /> New rider</label>
                <label className={form.riding_experience === 'experienced' ? 'selected' : ''}><input type="radio" name="experience" checked={form.riding_experience === 'experienced'} onChange={() => update('riding_experience', 'experienced')} /> Experienced rider</label>
              </div>
            </fieldset>
            {form.riding_experience === 'experienced' && <label>Months of riding experience<input type="number" min="0" max="1200" value={form.riding_duration_months} onChange={(e) => update('riding_duration_months', e.target.value)} /></label>}
            <label>Current bikes <span>Optional, comma-separated</span><input placeholder="KTM Duke 390, Triumph Street Triple" value={form.current_bikes} onChange={(e) => update('current_bikes', e.target.value)} /></label>
            <label>Previous bikes <span>Optional, comma-separated</span><input placeholder="Yamaha R3, Royal Enfield Interceptor" value={form.previous_bikes} onChange={(e) => update('previous_bikes', e.target.value)} /></label>
            <fieldset>
              <legend>Bike preferences <span>Optional</span></legend>
              <div className="onboarding-preferences">{PREFERENCES.map((preference) => <button key={preference} type="button" className={form.bike_preferences.includes(preference) ? 'selected' : ''} onClick={() => togglePreference(preference)}>{preference}</button>)}</div>
            </fieldset>
          </section>}

          {step === 3 && <section className="onboarding-step" aria-label="Marketplace goals">
            <label>City <span>Optional</span><input placeholder="Bengaluru" value={form.city} onChange={(e) => update('city', e.target.value)} /></label>
            <fieldset>
              <legend>What are you here to do?</legend>
              <select value={form.intent} onChange={(e) => update('intent', e.target.value)}>
                <option value="browse">Browse</option><option value="buy">Buy a bike</option><option value="sell">Sell a bike</option><option value="both">Buy and sell</option>
              </select>
            </fieldset>
            <label>Dream bike <span>Optional</span><input placeholder="Ducati Panigale V4" value={form.dream_bike} onChange={(e) => update('dream_bike', e.target.value)} /></label>
          </section>}

          <div className="onboarding-actions">
            {step > 1 && <button className="btn btn-ghost" type="button" onClick={() => setStep((current) => current - 1)}>Back</button>}
            {step < 3 ? <button className="btn btn-primary" type="button" onClick={nextStep}>Continue</button> : <button className="btn btn-primary onboarding-submit" disabled={loading} type="submit">{loading ? 'Saving profile...' : 'Complete profile'}</button>}
          </div>
        </form>
      </section>
    </div>
  );
}
