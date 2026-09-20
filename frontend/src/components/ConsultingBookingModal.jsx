import { useState } from 'react';
import { bookConsultation } from '../api';
import { toast } from '../context/ToastContext';
import { Icons } from './Icons';

export default function ConsultingBookingModal({ tier, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('₹15L - ₹30L');
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const selectedTier = tier || {
    id: 'strategy_call',
    title: '1-on-1 Strategy & Shortlist Video Call',
    price: 2999,
    duration: '45 Minutes'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error('Please provide your name, email, and contact number.');
      return;
    }

    setLoading(true);
    try {
      const res = await bookConsultation({
        client_name: name,
        client_email: email,
        client_phone: phone,
        tier_id: selectedTier.id,
        tier_title: selectedTier.title,
        tier_price: selectedTier.price,
        budget_range: budget,
        target_vehicle: vehicle,
        notes: notes
      });

      setConfirmed(res);
      toast.success('Consultation session booked successfully!');
    } catch (err) {
      toast.error('Could not complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div>
            <div className="badge badge-red" style={{ marginBottom: 4 }}>
              1-on-1 Private Advisory
            </div>
            <h2 className="modal-title">{selectedTier.title}</h2>
            <p className="modal-subtitle">
              Fee: Rs {selectedTier.price.toLocaleString('en-IN')} · Unbiased, Buyer-Centric Consulting
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        </div>

        <div className="modal-body">
          {confirmed ? (
            <div className="booking-confirmed-box">
              <div className="confirmed-icon">{Icons.shield}</div>
              <h3 className="confirmed-title">Consultation Confirmed</h3>
              <p className="confirmed-booking-id">Booking Ref: {confirmed.booking_id}</p>
              <p className="confirmed-desc">{confirmed.message}</p>
              <div className="confirmed-meta-card">
                <div className="meta-row">
                  <span className="meta-k">Consultation Tier:</span>
                  <span className="meta-v">{confirmed.tier_title}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-k">Client:</span>
                  <span className="meta-v">{confirmed.client_name} ({phone})</span>
                </div>
                <div className="meta-row">
                  <span className="meta-k">Consulting Fee:</span>
                  <span className="meta-v highlight">Rs {confirmed.tier_price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : (
            <form className="consulting-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98201 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Budget Range</label>
                  <select
                    className="input"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  >
                    <option value="Under ₹8L">Under ₹8 Lakhs</option>
                    <option value="₹8L - ₹15L">₹8L - ₹15 Lakhs</option>
                    <option value="₹15L - ₹30L">₹15L - ₹30 Lakhs</option>
                    <option value="₹30L - ₹60L">₹30L - ₹60 Lakhs</option>
                    <option value="₹60L - ₹1.5 Cr">₹60L - ₹1.5 Crore</option>
                    <option value="₹1.5 Cr+">₹1.5 Crore+ (Supercars/Superbikes)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Vehicles / Shortlist</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Virtus GT vs Slavia / 330i vs C300"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Key Doubts / Specific Inspection Details</label>
                <textarea
                  rows={3}
                  className="input"
                  placeholder="Mention any specific dilemmas: dealer discount vetting, test-drive impressions, used vehicle ad links, or maintenance concerns."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="consult-guarantee-note">
                {Icons.shield} 100% Unbiased Guarantee: Zero dealer kickbacks, zero brand sponsorships. Pure advice focused on your money and peace of mind.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: 48, marginTop: 4 }}
                disabled={loading}
              >
                {loading ? 'Confirming Session...' : `Book Consultation (Rs ${selectedTier.price.toLocaleString('en-IN')})`}
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {confirmed ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
