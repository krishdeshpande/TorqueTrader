import { Link } from 'react-router-dom';
import './ListingCard.css';

const STATUS_LABELS = {
  active: { label: 'Active', cls: 'badge-active' },
  draft:  { label: 'Draft',  cls: 'badge-draft'  },
  pending_verification: { label: 'Pending', cls: 'badge-pending' },
  sold:     { label: 'Sold',     cls: 'badge-sold'     },
  rejected: { label: 'Rejected', cls: 'badge-rejected' },
};

export default function ListingCard({ listing, showStatus = false }) {
  const { label, cls } = STATUS_LABELS[listing.status] ?? { label: listing.status, cls: 'badge-draft' };
  const score = listing.transparency_score ?? 0;
  const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--accent)';

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card card">
      <div className="listing-card-image">
        <div className="listing-card-placeholder">🏍️</div>
        {showStatus && (
          <span className={`badge ${cls} status-badge`}>{label}</span>
        )}
        <div className="score-pill" style={{ '--score-color': scoreColor }}>
          <span className="score-icon">✦</span>
          <span>{score}</span>
        </div>
      </div>

      <div className="listing-card-body">
        <div className="listing-card-title">
          {listing.year} {listing.make} {listing.model}
        </div>
        <div className="listing-card-price">
          ₹{Number(listing.price).toLocaleString('en-IN')}
        </div>
        <div className="listing-card-meta">
          <span>🔧 {listing.engine_config}</span>
          <span>⚡ {listing.bhp} BHP</span>
          <span>📍 {listing.location?.split(',')[0]}</span>
          <span>🛣️ {Number(listing.odometer).toLocaleString()} km</span>
        </div>
      </div>
    </Link>
  );
}
