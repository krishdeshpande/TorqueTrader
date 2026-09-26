import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import './Profile.css';

const PREFERENCES = ['Sport', 'Naked', 'Superbike', 'Cruiser', 'ADV', 'Touring', 'Retro / Classic', 'Scrambler', 'Electric'];

export default function Profile() {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    riding_experience: 'new', riding_duration_months: '',
    current_bikes: '', previous_bikes: '', bike_preferences: [],
    intent: 'browse', city: '', dream_bike: '',
  });

  // Initialize form from authoritative backend/auth state
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        riding_experience: user.riding_experience || 'new',
        riding_duration_months: user.riding_duration_months || '',
        current_bikes: Array.isArray(user.current_bikes) ? user.current_bikes.join(', ') : (user.current_bikes || ''),
        previous_bikes: Array.isArray(user.previous_bikes) ? user.previous_bikes.join(', ') : (user.previous_bikes || ''),
        bike_preferences: Array.isArray(user.bike_preferences) ? user.bike_preferences : [],
        intent: user.intent || 'browse',
        city: user.city || '',
        dream_bike: user.dream_bike || '',
      });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="profile-root container" style={{ paddingTop: 120 }}>
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const togglePreference = (preference) => {
    setForm((current) => {
      const prefs = current.bike_preferences || [];
      return {
        ...current,
        bike_preferences: prefs.includes(preference) ? prefs.filter((item) => item !== preference) : [...prefs, preference],
      };
    });
  };

  const handleCancel = () => {
    // Discard unsaved changes and restore last backend-backed state
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      riding_experience: user.riding_experience || 'new',
      riding_duration_months: user.riding_duration_months || '',
      current_bikes: Array.isArray(user.current_bikes) ? user.current_bikes.join(', ') : (user.current_bikes || ''),
      previous_bikes: Array.isArray(user.previous_bikes) ? user.previous_bikes.join(', ') : (user.previous_bikes || ''),
      bike_preferences: Array.isArray(user.bike_preferences) ? user.bike_preferences : [],
      intent: user.intent || 'browse',
      city: user.city || '',
      dream_bike: user.dream_bike || '',
    });
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.phone_number.trim()) {
      toast.error('First name, last name, and phone number are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        riding_experience: form.riding_experience,
        riding_duration_months: form.riding_experience === 'experienced' && form.riding_duration_months ? Number(form.riding_duration_months) : null,
        current_bikes: form.current_bikes.split(',').map((item) => item.trim()).filter(Boolean),
        previous_bikes: form.previous_bikes.split(',').map((item) => item.trim()).filter(Boolean),
        bike_preferences: form.bike_preferences,
        intent: form.intent,
        city: form.city.trim(),
        dream_bike: form.dream_bike.trim(),
      };

      await updateUserProfile(payload);
      toast.success('Profile updated successfully.');
      setIsEditing(false); // Only exit edit mode on success
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile. Please try again.');
      // Remains in edit mode, preserving unsaved input
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-root">
      <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="profile-header">
          <div>
            <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
            <h1 className="profile-title">Rider Profile</h1>
            <p className="profile-subtitle">Manage your personal and riding information.</p>
          </div>
          {!isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          {/* Identity Section */}
          <section className="profile-section">
            <h2 className="section-title">Identity</h2>
            <div className="profile-grid two-columns">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="input" required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} disabled={!isEditing} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="input" required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} disabled={!isEditing} />
              </div>
            </div>
            <div className="profile-grid two-columns" style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" value={form.email} disabled style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                <span className="form-hint">Email is your authentication identity and cannot be changed.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="input" required type="tel" placeholder="+91 98765 43210" value={form.phone_number} onChange={(e) => update('phone_number', e.target.value)} disabled={!isEditing} />
              </div>
            </div>
          </section>

          {/* Riding Profile Section */}
          <section className="profile-section">
            <h2 className="section-title">Riding Profile</h2>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Riding Experience</label>
              <div className="choice-row">
                <label className={`choice-chip ${form.riding_experience === 'new' ? 'selected' : ''}`}>
                  <input type="radio" name="experience" checked={form.riding_experience === 'new'} onChange={() => update('riding_experience', 'new')} disabled={!isEditing} /> New rider
                </label>
                <label className={`choice-chip ${form.riding_experience === 'experienced' ? 'selected' : ''}`}>
                  <input type="radio" name="experience" checked={form.riding_experience === 'experienced'} onChange={() => update('riding_experience', 'experienced')} disabled={!isEditing} /> Experienced rider
                </label>
              </div>
            </div>

            {form.riding_experience === 'experienced' && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Months of Riding Experience</label>
                <input className="input" type="number" min="0" max="1200" value={form.riding_duration_months} onChange={(e) => update('riding_duration_months', e.target.value)} disabled={!isEditing} />
              </div>
            )}

            <div className="profile-grid two-columns">
              <div className="form-group">
                <label className="form-label">Current Bikes <span className="optional-hint">Optional, comma-separated</span></label>
                <input className="input" placeholder="KTM Duke 390, Triumph Street Triple" value={form.current_bikes} onChange={(e) => update('current_bikes', e.target.value)} disabled={!isEditing} />
              </div>
              <div className="form-group">
                <label className="form-label">Previous Bikes <span className="optional-hint">Optional, comma-separated</span></label>
                <input className="input" placeholder="Yamaha R3, Royal Enfield Interceptor" value={form.previous_bikes} onChange={(e) => update('previous_bikes', e.target.value)} disabled={!isEditing} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Bike Preferences <span className="optional-hint">Optional</span></label>
              <div className="preferences-grid">
                {PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    className={`preference-chip ${form.bike_preferences.includes(pref) ? 'selected' : ''}`}
                    onClick={() => isEditing && togglePreference(pref)}
                    disabled={!isEditing}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="profile-section">
            <h2 className="section-title">Marketplace Preferences</h2>
            <div className="profile-grid two-columns">
              <div className="form-group">
                <label className="form-label">City <span className="optional-hint">Optional</span></label>
                <input className="input" placeholder="Bengaluru" value={form.city} onChange={(e) => update('city', e.target.value)} disabled={!isEditing} />
              </div>
              <div className="form-group">
                <label className="form-label">Intent</label>
                <select className="input" value={form.intent} onChange={(e) => update('intent', e.target.value)} disabled={!isEditing}>
                  <option value="browse">Browse</option>
                  <option value="buy">Buy a bike</option>
                  <option value="sell">Sell a bike</option>
                  <option value="both">Buy and sell</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Dream Bike <span className="optional-hint">Optional</span></label>
              <input className="input" placeholder="Ducati Panigale V4" value={form.dream_bike} onChange={(e) => update('dream_bike', e.target.value)} disabled={!isEditing} />
            </div>
          </section>

          {/* Actions */}
          {isEditing && (
            <div className="profile-actions">
              <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving Changes...' : 'Save Changes'}</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
