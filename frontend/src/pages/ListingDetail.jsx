import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListings, revealPhone, whatsappClick } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import AuthModal from '../components/AuthModal';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone]     = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    // Fetch single listing by filtering for its ID (workaround since no GET /listings/:id endpoint yet)
    getListings({ limit: 100 })
      .then(({ data }) => {
        const found = data.find(l => String(l.id) === String(id));
        if (!found) navigate('/listings');
        else setListing(found);
      })
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRevealPhone = async () => {
    if (!user) { setShowAuth(true); return; }
    setRevealing(true);
    try {
      const { data } = await revealPhone(listing.id);
      setPhone(data.phone_number || data.contact || 'Contact via WhatsApp');
      toast.success('Seller contact revealed!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not reveal contact');
    } finally { setRevealing(false); }
  };

  const handleWhatsApp = async () => {
    if (!user) { setShowAuth(true); return; }
    try { await whatsappClick(listing.id); } catch (_) {}
    const msg = encodeURIComponent(`Hi, I'm interested in the ${listing.year} ${listing.make} ${listing.model} listed on TorqueTrader (ID: ${listing.id})`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!listing) return null;

  const score = listing.transparency_score ?? 0;
  const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--accent)';

  return (
    <div className="detail-page">
      <div className="container detail-layout">
        {/* Left — photo + contact */}
        <div className="detail-left">
          <div className="detail-photo">
            <div className="detail-photo-placeholder">🏍️</div>
          </div>

          {/* Transparency Score */}
          <div className="score-card card">
            <div className="score-header">
              <span className="score-label">Transparency Score</span>
              <span className="score-value" style={{ color: scoreColor }}>{score}/100</span>
            </div>
            <div className="score-bar-bg">
              <div className="score-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <p className="score-desc">
              {score >= 70 ? '✅ Highly verified listing with complete documentation.'
               : score >= 40 ? '⚠️ Partially verified. Some documents pending.'
               : '❌ Unverified listing. Proceed with caution.'}
            </p>
          </div>

          {/* Contact */}
          <div className="contact-card card">
            <h3 className="contact-title">Interested in this bike?</h3>
            {phone ? (
              <a href={`tel:${phone}`} className="btn btn-primary btn-full">📞 {phone}</a>
            ) : (
              <button id="reveal-phone-btn" className="btn btn-primary btn-full" onClick={handleRevealPhone} disabled={revealing}>
                {revealing ? 'Revealing…' : '🔒 Reveal Seller Contact'}
              </button>
            )}
            <button id="whatsapp-btn" className="btn btn-outline btn-full" style={{ marginTop: 10 }} onClick={handleWhatsApp}>
              💬 WhatsApp Seller
            </button>
          </div>
        </div>

        {/* Right — details */}
        <div className="detail-right">
          <div className="detail-breadcrumb">
            <span onClick={() => navigate('/listings')} className="crumb">Browse</span>
            <span className="crumb-sep">›</span>
            <span className="crumb active">{listing.make} {listing.model}</span>
          </div>

          <h1 className="detail-title">
            {listing.year} {listing.make} {listing.model}
          </h1>
          <div className="detail-price">
            ₹{Number(listing.price).toLocaleString('en-IN')}
          </div>
          <div className="detail-location">📍 {listing.location}</div>

          <div className="specs-grid">
            {[
              { label: 'Engine',    value: listing.engine_config },
              { label: 'Body Type', value: listing.body_type },
              { label: 'Power',     value: `${listing.bhp} BHP` },
              { label: 'Odometer',  value: `${Number(listing.odometer).toLocaleString()} km` },
              { label: 'Year',      value: listing.year },
              { label: 'Status',    value: listing.status?.replace('_', ' ').toUpperCase() },
            ].map(s => (
              <div key={s.label} className="spec-item">
                <div className="spec-label">{s.label}</div>
                <div className="spec-value">{s.value}</div>
              </div>
            ))}
          </div>

          {listing.description && (
            <div className="detail-description">
              <h3>About this bike</h3>
              <p>{listing.description}</p>
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
