import { Link } from 'react-router-dom';
import { Icons } from './Icons';
import './ListingCard.css';

const STATUS = {
  active:               { label: 'Active',   cls: 'badge-green' },
  draft:                { label: 'Draft',    cls: 'badge-gray'  },
  pending_verification: { label: 'Pending',  cls: 'badge-amber' },
  sold:                 { label: 'Sold',     cls: 'badge-red'   },
  rejected:             { label: 'Rejected', cls: 'badge-red'   },
};

function ScorePill({ score }) {
  const color = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red';
  return (
    <span className={`score-pill score-${color}`}>
      {Icons.check} {score}/100
    </span>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="listing-card listing-card-skeleton">
      <div className="card-img-wrap skeleton" style={{ height: 200 }} />
      <div className="card-body">
        <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: '75%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 28, width: '55%', marginBottom: 16 }} />
        <div style={{ display:'flex', gap:8 }}>
          <div className="skeleton" style={{ height: 12, flex: 1 }} />
          <div className="skeleton" style={{ height: 12, flex: 1 }} />
          <div className="skeleton" style={{ height: 12, flex: 1 }} />
        </div>
      </div>
    </div>
  );
}

export default function ListingCard({ listing, showStatus = false }) {
  const { label, cls } = STATUS[listing.status] ?? { label: listing.status, cls: 'badge-gray' };
  const score = listing.transparency_score ?? 0;

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card card">
      {/* Photo */}
      <div className="card-img-wrap">
        <div className="card-img-placeholder">
          {Icons.bike}
        </div>
        <ScorePill score={score} />
        {showStatus && <span className={`badge ${cls} card-status`}>{label}</span>}
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-year-make">
          <span className="card-year">{listing.year}</span>
          <span className="card-make">{listing.make}</span>
        </div>
        <div className="card-model">{listing.model}</div>
        <div className="card-price">₹{Number(listing.price).toLocaleString('en-IN')}</div>

        <div className="card-specs">
          <span className="spec-tag">{Icons.road}{Number(listing.odometer).toLocaleString()} km</span>
          <span className="spec-tag">{Icons.gauge}{listing.engine_config}</span>
          <span className="spec-tag">{Icons.zap}{listing.bhp} BHP</span>
        </div>

        <div className="card-footer">
          <span className="card-location">{Icons.mapPin}{listing.location?.split(',')[0]}</span>
        </div>
      </div>
    </Link>
  );
}
