import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings } from '../api';
import ListingCard from '../components/ListingCard';
import './Home.css';

const MAKES = ['Ducati', 'BMW', 'Kawasaki', 'Triumph', 'Harley-Davidson', 'KTM', 'Yamaha', 'Honda', 'Suzuki', 'Royal Enfield'];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getListings({ limit: 6 })
      .then(({ data }) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/listings?location=${encodeURIComponent(search)}`);
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">🏆 India's #1 Verified Superbike Marketplace</div>
          <h1 className="hero-title">
            Buy &amp; Sell Premium<br />
            <span className="hero-accent">Superbikes</span> with<br />
            Full Transparency
          </h1>
          <p className="hero-subtitle">
            Every listing is verified and scored for transparency. No guesswork, no scams —
            just the bikes you love.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              id="hero-search-input"
              type="text"
              className="input hero-input"
              placeholder="Search by city, e.g. Mumbai, Bangalore…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button id="hero-search-btn" type="submit" className="btn btn-primary hero-search-btn">
              🔍 Search
            </button>
          </form>
          <div className="hero-makes">
            {MAKES.map(m => (
              <Link key={m} to={`/listings?make=${m}`} className="make-pill">{m}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="container stats-inner">
          {[
            { icon: '🏍️', value: '500+',  label: 'Verified Listings' },
            { icon: '🛡️', value: '100%',  label: 'Transparency Checked' },
            { icon: '📍', value: '30+',   label: 'Cities Covered' },
            { icon: '⚡', value: '₹50Cr+', label: 'Transactions Facilitated' },
          ].map((s) => (
            <div className="stat-item" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Latest Listings</h2>
            <p className="section-subtitle">Freshly added, verified superbikes</p>
          </div>
          <Link to="/listings" className="btn btn-ghost">View All →</Link>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏍️</div>
            <h3>No listings yet</h3>
            <p>Be the first to list your superbike!</p>
            <Link to="/dashboard/new" className="btn btn-primary" style={{ marginTop: 16 }}>List Your Bike</Link>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner">
          <h2 className="cta-title">Ready to sell your superbike?</h2>
          <p className="cta-sub">List in minutes. Reach verified buyers across India.</p>
          <Link to="/dashboard/new" className="btn btn-primary cta-btn">
            🚀 List Your Bike for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-logo">⚡ TorqueTrader</div>
          <p className="footer-copy">© 2024 TorqueTrader. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
