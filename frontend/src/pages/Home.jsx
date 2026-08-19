import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings, rcLookup } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';
import './Home.css';

const BRANDS = ['Ducati', 'BMW', 'Kawasaki', 'Triumph', 'Aprilia', 'KTM', 'Harley-Davidson', 'Suzuki'];

const MARKET_BENCHMARKS = [
  { model: 'Ducati Panigale V4 S (2022-2023)', range: 'Rs 25.5L - Rs 29.0L', status: 'High Demand' },
  { model: 'BMW S1000RR M-Package (2021-2023)', range: 'Rs 22.0L - Rs 26.5L', status: 'Stable' },
  { model: 'Kawasaki Ninja ZX-10R (2021-2023)', range: 'Rs 15.5L - Rs 18.0L', status: 'Active' },
  { model: 'Triumph Street Triple 765 RS (2022-2024)', range: 'Rs 11.5L - Rs 13.2L', status: 'High Demand' },
];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [plateInput, setPlateInput] = useState('');
  const [plateLoading, setPlateLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getListings()
      .then(({ data }) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedBrand) {
      navigate(`/listings?make=${encodeURIComponent(selectedBrand)}`);
    } else {
      navigate('/listings');
    }
  };

  const handlePlateCheck = async (e) => {
    e.preventDefault();
    if (!plateInput.trim()) return;
    setPlateLoading(true);
    try {
      const data = await rcLookup(plateInput);
      navigate('/dashboard/new', { state: { prefillRC: data } });
    } catch (_) {
      navigate('/dashboard/new');
    } finally {
      setPlateLoading(false);
    }
  };

  const featured = listings[0] || null;

  return (
    <div className="home-root">
      {/* ── Marketplace Hero Banner ───────────────────────────────────────── */}
      <section className="home-hero-section">
        <div className="container">
          <div className="hero-grid-layout">
            {/* Left Content Column */}
            <div className="hero-text-col">
              <div className="hero-meta-badge">
                <span className="badge-tag">MARKETPLACE</span>
                <span className="badge-desc">Verified High-Performance Motorcycles</span>
              </div>

              <h1 className="hero-main-title">
                The Trusted Marketplace for Premium Superbikes.
              </h1>

              <p className="hero-subtext">
                Every listing is verified against official RTO records, backed by authentic workshop service history, and sold directly by verified enthusiasts.
              </p>

              {/* Main Search & Brand Selector */}
              <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
                <div className="search-field-group">
                  <span className="search-icon-slot">{Icons.search}</span>
                  <select
                    className="hero-select-input"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  >
                    <option value="">All Manufacturers (Ducati, BMW, Kawasaki...)</option>
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary hero-submit-btn">
                  Browse Inventory
                </button>
              </form>

              {/* Quick Filter Pills */}
              <div className="hero-quick-brands">
                <span className="quick-label">Popular:</span>
                {BRANDS.slice(0, 5).map((b) => (
                  <button
                    key={b}
                    type="button"
                    className="brand-pill-btn"
                    onClick={() => navigate(`/listings?make=${encodeURIComponent(b)}`)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Instant mParivahan RC Plate Lookup Tool */}
            <div className="hero-rc-lookup-card">
              <div className="rc-card-header">
                <div className="rc-card-icon">{Icons.shield}</div>
                <div>
                  <h2 className="rc-card-title">Instant mParivahan RC Decoder</h2>
                  <p className="rc-card-sub">Sell your superbike with 10-second autofill</p>
                </div>
              </div>

              <form className="rc-plate-form" onSubmit={handlePlateCheck}>
                <label className="form-label" htmlFor="plate-lookup-input">
                  Enter Vehicle Registration Number
                </label>
                <div className="plate-input-wrapper">
                  <div className="plate-ind-tag">
                    <span className="ind-country">IND</span>
                  </div>
                  <input
                    id="plate-lookup-input"
                    type="text"
                    className="plate-text-input"
                    placeholder="MH02DW1234"
                    maxLength={13}
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                  />
                </div>
                <p className="plate-hint">
                  Supports all Indian RTO plates (MH, DL, KA, TN, HR, GJ, TS, KL, WB).
                </p>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 46 }}
                  disabled={plateLoading || !plateInput.trim()}
                >
                  {plateLoading ? 'Verifying with VAHAN...' : 'Autofill & Create Listing'}
                </button>
              </form>

              <div className="rc-feature-list">
                <div className="rc-feature-item">
                  <span className="rc-check">{Icons.check}</span>
                  <span>Autofills Make, Model, Year, and Engine CC</span>
                </div>
                <div className="rc-feature-item">
                  <span className="rc-check">{Icons.check}</span>
                  <span>Verifies Ownership Serial & Insurance Expiry</span>
                </div>
                <div className="rc-feature-item">
                  <span className="rc-check">{Icons.check}</span>
                  <span>Generates Verified Transparency Badge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Superbike Spotlight ─────────────────────────────────── */}
      {featured && (
        <section className="featured-spotlight-section">
          <div className="container">
            <div className="section-header-row">
              <div>
                <span className="section-eyebrow">EDITORIAL SPOTLIGHT</span>
                <h2 className="section-heading">Featured Superbike of the Week</h2>
              </div>
              <Link to={`/listings/${featured.id}`} className="btn btn-secondary btn-sm">
                View Full Dossier {Icons.chevronRight}
              </Link>
            </div>

            <div className="spotlight-card">
              <div className="spotlight-media">
                <img
                  src={featured.images?.hero || "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80"}
                  alt={`${featured.year} ${featured.make} ${featured.model}`}
                  className="spotlight-img"
                />
                <div className="spotlight-badge">
                  <span className="badge badge-green">{Icons.shield} Score: {featured.transparency_score}/100</span>
                  <span className="badge badge-gray">{featured.rto_state || 'MH02 RTO'}</span>
                </div>
              </div>

              <div className="spotlight-content">
                <div className="spotlight-meta">
                  <span>{featured.year} {featured.make}</span>
                  <span>•</span>
                  <span>{Number(featured.odometer).toLocaleString()} km</span>
                  <span>•</span>
                  <span>{featured.ownership_count === 1 ? 'Single Owner' : `${featured.ownership_count} Owners`}</span>
                </div>

                <h3 className="spotlight-title">
                  <Link to={`/listings/${featured.id}`}>{featured.model}</Link>
                </h3>

                <div className="spotlight-price">
                  Rs {Number(featured.price).toLocaleString('en-IN')}
                </div>

                <p className="spotlight-review">
                  "{featured.editorial_review || 'Meticulously maintained, complete authorized service documentation, fitted with premium performance upgrades and stored in a private garage.'}"
                </p>

                <div className="spotlight-specs-row">
                  <div className="spotlight-spec">
                    <span className="k">Power</span>
                    <span className="v">{featured.bhp} BHP</span>
                  </div>
                  <div className="spotlight-spec">
                    <span className="k">Engine</span>
                    <span className="v">{featured.displacement_cc ? `${featured.displacement_cc}cc` : featured.engine_config}</span>
                  </div>
                  <div className="spotlight-spec">
                    <span className="k">Exhaust</span>
                    <span className="v">{featured.exhaust_type || 'Stock Titanium'}</span>
                  </div>
                  <div className="spotlight-spec">
                    <span className="k">Location</span>
                    <span className="v">{featured.location?.split(',')[0]}</span>
                  </div>
                </div>

                <div className="spotlight-actions">
                  <Link to={`/listings/${featured.id}`} className="btn btn-primary">
                    Inspect Specifications
                  </Link>
                  <Link to="/listings" className="btn btn-ghost">
                    All Listings ({listings.length})
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Active Inventory Grid ────────────────────────────────────────── */}
      <section className="inventory-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">VERIFIED INVENTORY</span>
              <h2 className="section-heading">Available Superbikes</h2>
              <p className="section-subtext">Each vehicle includes verified registration and transparent condition disclosures.</p>
            </div>
            <Link to="/listings" className="btn btn-secondary btn-sm">
              Explore All Superbikes ({listings.length}) {Icons.chevronRight}
            </Link>
          </div>

          <div className="listings-grid-layout">
            {loading ? (
              Array(6).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)
            ) : listings.length === 0 ? (
              <div className="empty-inventory-box">
                <p>No active listings found in this category.</p>
                <Link to="/dashboard/new" className="btn btn-primary" style={{ marginTop: 12 }}>
                  Create the First Listing
                </Link>
              </div>
            ) : (
              listings.slice(0, 6).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Market Benchmark Index ───────────────────────────────────────── */}
      <section className="market-index-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">VALUATION DATA</span>
              <h2 className="section-heading">Indian Superbike Market Index</h2>
              <p className="section-subtext">Real-time fair market value bands based on verified transactions across Indian metros.</p>
            </div>
          </div>

          <div className="market-table-box">
            <table className="market-table">
              <thead>
                <tr>
                  <th>Vehicle Designation</th>
                  <th>Fair Market Band</th>
                  <th>Market Liquidity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {MARKET_BENCHMARKS.map((item, idx) => (
                  <tr key={idx}>
                    <td className="market-model-cell">{item.model}</td>
                    <td className="market-price-cell">{item.range}</td>
                    <td>
                      <span className="market-tag-pill">{item.status}</span>
                    </td>
                    <td>
                      <Link to={`/listings?make=${encodeURIComponent(item.model.split(' ')[0])}`} className="market-link">
                        View Active Market {Icons.chevronRight}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Verification Pillars (Zero Checkmark Cliché, Structural Specs) ── */}
      <section className="trust-standards-section">
        <div className="container">
          <div className="standards-banner">
            <div className="standards-col">
              <span className="std-num">01</span>
              <h3 className="std-title">mParivahan RC Validation</h3>
              <p className="std-desc">
                Registration plate, engine number, ownership sequence, and RTO jurisdiction are cross-checked prior to publication.
              </p>
            </div>
            <div className="standards-col">
              <span className="std-num">02</span>
              <h3 className="std-title">Authorized Workshop Records</h3>
              <p className="std-desc">
                Service logs, major valve-clearance intervals, recall compliance, and authorized workshop invoices are audited.
              </p>
            </div>
            <div className="standards-col">
              <span className="std-num">03</span>
              <h3 className="std-title">Transparent Flaw Disclosures</h3>
              <p className="std-desc">
                Sellers are required to document all modifications and close-up photography of cosmetic or mechanical imperfections.
              </p>
            </div>
            <div className="standards-col">
              <span className="std-num">04</span>
              <h3 className="std-title">Direct Buyer-Seller Settlement</h3>
              <p className="std-desc">
                Direct WhatsApp and verified telephone connection without middleman markups or brokerage fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Studio Footer ─────────────────────────────────────────────────── */}
      <footer className="home-footer-root">
        <div className="container footer-content-grid">
          <div className="footer-col-main">
            <div className="footer-brand-title">TORQUE<span>TRADER</span></div>
            <p className="footer-brand-desc">
              India's transparent marketplace for verified high-performance motorcycles. Built for enthusiasts, backed by official registration data.
            </p>
            <div className="footer-rto-note">
              Operating across Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Pune, and all Indian RTO jurisdictions.
            </div>
          </div>

          <div className="footer-col-nav">
            <h4 className="footer-heading">Marketplace</h4>
            <Link to="/listings" className="footer-link">Browse Superbikes</Link>
            <Link to="/dashboard/new" className="footer-link">mParivahan RC Tool</Link>
            <Link to="/dashboard/new" className="footer-link">Sell Your Motorcycle</Link>
            <Link to="/dashboard" className="footer-link">Seller Dashboard</Link>
          </div>

          <div className="footer-col-nav">
            <h4 className="footer-heading">Legal & Compliance</h4>
            <button type="button" className="footer-link-btn" onClick={() => setShowTerms(true)}>
              Terms of Service
            </button>
            <button type="button" className="footer-link-btn" onClick={() => setShowPrivacy(true)}>
              Privacy Policy
            </button>
            <span className="footer-static-note">Motor Vehicles Act, 1988 Compliance</span>
            <span className="footer-static-note">Form 29 / 30 Transfer Guidelines</span>
          </div>
        </div>

        <div className="container footer-bottom-bar">
          <span>© 2026 TorqueTrader Technologies India. All rights reserved.</span>
          <span>Zero Commission Classified Platform</span>
        </div>
      </footer>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}
