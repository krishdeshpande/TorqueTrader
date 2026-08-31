import { Link } from 'react-router-dom';
import { Icons } from './Icons';
import './ListingCard.css';

export function ListingCardSkeleton() {
  return (
    <div className="listing-card-skeleton">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line sm" />
        <div className="skeleton-line md" />
        <div className="skeleton-line lg" />
        <div className="skeleton-line-row">
          <div className="skeleton-line" style={{ width: '30%' }} />
          <div className="skeleton-line" style={{ width: '30%' }} />
          <div className="skeleton-line" style={{ width: '30%' }} />
        </div>
      </div>
    </div>
  );
}

export default function ListingCard({ listing, showStatus = false }) {
  const score = listing.transparency_score || 90;
  const heroImg = listing.images?.hero || "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80";

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card" id={`listing-card-${listing.id}`}>
      {/* Photo Container */}
      <div className="card-photo-box">
        <img
          src={heroImg}
          alt={`${listing.year} ${listing.make} ${listing.model}`}
          className="card-photo-img"
          loading="lazy"
        />
        
        {/* Top Badges */}
        <div className="card-badge-top-row">
          <span className="card-rto-pill">
            {listing.rto_state ? listing.rto_state.split(' ')[0] : 'RTO Verified'}
          </span>
          <span className="card-score-pill">
            <span className="score-icon">{Icons.shield}</span>
            {score}/100 Score
          </span>
        </div>

        {/* Bottom Tag Bar */}
        <div className="card-badge-bot-row">
          {listing.ownership_count === 1 && (
            <span className="card-single-owner-tag">Single Owner</span>
          )}
          {listing.exhaust_type && listing.exhaust_type.toLowerCase().includes('akrapovic') && (
            <span className="card-mod-tag">Akrapovic</span>
          )}
        </div>
      </div>

      {/* Details Box */}
      <div className="card-body-box">
        <div className="card-meta-line">
          <span className="card-year-make">{listing.year} {listing.make}</span>
          <span className="card-odo">{Number(listing.odometer).toLocaleString('en-IN')} km</span>
        </div>

        <h3 className="card-model-title">{listing.model}</h3>

        <div className="card-price-line">
          <span className="card-price-val">Rs {Number(listing.price).toLocaleString('en-IN')}</span>
          <span className="card-verified-lbl">{Icons.check} Verified</span>
        </div>

        <div className="card-specs-matrix">
          <div className="spec-item">
            <span className="spec-k">Engine</span>
            <span className="spec-v">{listing.displacement_cc ? `${listing.displacement_cc}cc` : listing.engine_config}</span>
          </div>
          <div className="spec-item">
            <span className="spec-k">Power</span>
            <span className="spec-v">{listing.bhp} BHP</span>
          </div>
          <div className="spec-item">
            <span className="spec-k">Layout</span>
            <span className="spec-v">{listing.engine_config}</span>
          </div>
        </div>

        <div className="card-location-footer">
          <span className="location-text">
            {Icons.pin} {listing.location ? listing.location.split(',')[0] : 'India'}
          </span>
          <span className="view-link">
            View Details {Icons.chevronRight}
          </span>
        </div>
      </div>
    </Link>
  );
}
