import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListings, revealPhone, whatsappClick } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import AuthModal from '../components/AuthModal';
import { Icons } from '../components/Icons';
import './ListingDetail.css';

const SCORE_SEGMENTS = ['RC Transfer', 'Insurance', 'Service Records', 'Accident Free', 'Original Parts'];

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [phone, setPhone]       = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    getListings({ limit: 100 })
      .then(({ data }) => {
        const found = data.find(l => String(l.id) === String(id));
        if (!found) navigate('/listings');
        else setListing(found);
      })
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReveal = async () => {
    if (!user) { setShowAuth(true); return; }
    setRevealing(true);
    try {
      const { data } = await revealPhone(listing.id);
      setPhone(data.phone_number || data.contact || '+91 XXXXXXXXXX');
      toast.success('Seller contact revealed!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not reveal contact');
    } finally { setRevealing(false); }
  };

  const handleWhatsApp = async () => {
    if (!user) { setShowAuth(true); return; }
    try { await whatsappClick(listing.id); } catch (_) {}
    const msg = encodeURIComponent(`Hi, I'm interested in the ${listing.year} ${listing.make} ${listing.model} listed on TorqueTrader (ID: #${listing.id}). Is it still available?`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="container detail-layout">
          <div>
            <div className="skeleton" style={{ height: 360, borderRadius: 12 }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="skeleton" style={{ height: 20, width: '60%' }} />
            <div className="skeleton" style={{ height: 36, width: '80%' }} />
            <div className="skeleton" style={{ height: 48, width: '55%' }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const score = listing.transparency_score ?? 0;

  return (
    <div className="detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate('/listings')} className="crumb">Browse</button>
          <span className="crumb-sep">{Icons.chevronRight}</span>
          <span className="crumb">{listing.make}</span>
          <span className="crumb-sep">{Icons.chevronRight}</span>
          <span className="crumb crumb-active">{listing.model}</span>
        </nav>

        <div className="detail-layout">
          {/* Left column */}
          <div className="detail-left">
            {/* Photo gallery */}
            <div className="gallery-main">
              <div className="gallery-placeholder">{Icons.bike}</div>
              <div className="gallery-tag">No photos uploaded yet</div>
            </div>

            {/* Specs table */}
            <div className="specs-section">
              <h3 className="specs-title">Specifications</h3>
              <table className="specs-table">
                <tbody>
                  {[
                    ['Make',         listing.make],
                    ['Model',        listing.model],
                    ['Year',         listing.year],
                    ['Engine',       listing.engine_config],
                    ['Body Type',    listing.body_type],
                    ['Power',        `${listing.bhp} BHP`],
                    ['Odometer',     `${Number(listing.odometer).toLocaleString()} km`],
                    ['Location',     listing.location],
                  ].map(([label, value]) => (
                    <tr key={label} className="specs-row">
                      <td className="spec-label-cell">{label}</td>
                      <td className="spec-value-cell">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="detail-desc">
                <h3 className="specs-title">Seller Notes</h3>
                <p>{listing.description}</p>
              </div>
            )}

            {/* Why TorqueTrader */}
            <div className="why-tt">
              <h3 className="specs-title">Why buy on TorqueTrader?</h3>
              {[
                'RC document verified before listing',
                'Transparency Score checked by our team',
                'Seller identity and contact confirmed',
              ].map(t => (
                <div key={t} className="why-item">
                  <span className="why-check" style={{ color: 'var(--green)' }}>{Icons.checkCircle}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — sticky panel */}
          <div className="detail-right">
            <div className="detail-panel card">
              {/* Title + price */}
              <div className="panel-title-block">
                <div className="panel-year-make">{listing.year} · {listing.make}</div>
                <h1 className="panel-model">{listing.model}</h1>
                <div className="panel-price">₹{Number(listing.price).toLocaleString('en-IN')}</div>
                <div className="panel-location">{Icons.mapPin}{listing.location}</div>
              </div>

              {/* Transparency Score */}
              <div className="panel-score">
                <div className="score-row">
                  <span className="score-row-label">Transparency Score</span>
                  <span className={`score-num ${score >= 70 ? 'score-g' : score >= 40 ? 'score-a' : 'score-r'}`}>
                    {score}/100
                  </span>
                </div>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{
                    width: `${score}%`,
                    background: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)',
                  }} />
                </div>
                <div className="score-segments">
                  {SCORE_SEGMENTS.map(s => (
                    <span key={s} className={`score-seg ${score >= 60 ? 'seg-pass' : 'seg-unknown'}`}>
                      {score >= 60 ? Icons.check : '–'} {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="panel-cta">
                {phone ? (
                  <a href={`tel:${phone}`} className="btn btn-primary" style={{ width:'100%', height:52, fontSize:'1rem' }}>
                    {Icons.user} {phone}
                  </a>
                ) : (
                  <button id="reveal-phone-btn" className="btn btn-primary" style={{ width:'100%', height:52, fontSize:'1rem' }}
                    onClick={handleReveal} disabled={revealing}>
                    {revealing ? 'Revealing contact…' : '🔒 Reveal Seller Contact'}
                  </button>
                )}
                <button id="whatsapp-btn" className="btn-whatsapp" onClick={handleWhatsApp}>
                  <span className="wa-icon">{Icons.whatsapp}</span>
                  Chat on WhatsApp
                </button>
              </div>

              {/* Seller type */}
              <div className="panel-seller">
                <span className="seller-label">Listed by</span>
                <span className="badge badge-gray">{listing.seller_type || 'Individual Seller'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
