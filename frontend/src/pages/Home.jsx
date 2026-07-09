import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import './Home.css';

const MAKES  = ['Ducati','BMW','Kawasaki','Triumph','Harley-Davidson','KTM','Yamaha','Honda'];
const PRICES = ['Under ₹10L','Under ₹20L','Under ₹30L','Under ₹50L'];

// Floating mock card shown in hero
function MockCard() {
  return (
    <div className="mock-card">
      <div className="mock-card-img">
        <svg width="100" height="64" viewBox="0 0 120 70" fill="none" stroke="#D1D5DB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22" cy="50" r="16"/><circle cx="98" cy="50" r="16"/>
          <path d="M22 50 L45 20 L75 20 L98 50"/>
          <path d="M45 20 L38 50"/><path d="M75 20 L85 30 L98 50"/>
          <path d="M60 20 L60 35 L70 42"/>
          <path d="M75 20 L80 14 L90 14"/>
        </svg>
        <span className="mock-score">✓ Score: 91</span>
      </div>
      <div className="mock-body">
        <div className="mock-meta">2023 · DUCATI</div>
        <div className="mock-title">Panigale V4 S</div>
        <div className="mock-price">₹28,50,000</div>
        <div className="mock-specs">
          <span>5,200 km</span><span>·</span><span>V-Twin</span><span>·</span><span>214 BHP</span>
        </div>
        <div className="mock-footer">📍 Mumbai, Maharashtra</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [location, setLocation] = useState('');
  const [make, setMake]         = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getListings({ limit: 6 })
      .then(({ data }) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (make)     params.set('make', make);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="home-page">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-left">
            <div className="hero-tag">🏆 India's #1 Verified Superbike Platform</div>
            <h1 className="hero-title">
              India's Most Trusted<br />
              <span className="hero-red">Superbike</span> Marketplace
            </h1>
            <p className="hero-body">
              Every listing is inspected, scored for transparency, and backed by verified documents — so you can buy with confidence.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <div className="search-city">
                <span className="search-icon">{Icons.mapPin}</span>
                <input
                  id="hero-city-input"
                  className="search-input"
                  type="text"
                  placeholder="City or state…"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
              <div className="search-divider" />
              <div className="search-make">
                <select
                  id="hero-make-select"
                  className="search-input"
                  value={make}
                  onChange={e => setMake(e.target.value)}
                >
                  <option value="">All brands</option>
                  {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button id="hero-search-btn" type="submit" className="btn btn-primary search-btn">
                {Icons.search} Search
              </button>
            </form>

            <div className="hero-pills">
              {MAKES.slice(0,5).map(m => (
                <button key={m} className="hero-pill" onClick={() => navigate(`/listings?make=${m}`)}>{m}</button>
              ))}
              {PRICES.map(p => (
                <button key={p} className="hero-pill hero-pill-price" onClick={() => {
                  const val = p.replace('Under ₹','').replace('L','');
                  navigate(`/listings?max_price=${Number(val) * 100000}`);
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <MockCard />
            <div className="hero-badge-float">
              <span className="hbf-dot" />
              <span>Live listing</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className="trust-bar">
        <div className="container trust-inner">
          {[
            { icon: Icons.listCheck, val: '500+',  label: 'Verified Listings' },
            { icon: Icons.shield,    val: '100%',  label: 'RC Verified Bikes' },
            { icon: Icons.mapPin,    val: '30+',   label: 'Cities Covered'    },
            { icon: Icons.star,      val: '4.8★',  label: 'Buyer Satisfaction' },
          ].map(({ icon, val, label }) => (
            <div key={label} className="trust-item">
              <div className="trust-icon">{icon}</div>
              <div className="trust-val">{val}</div>
              <div className="trust-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Latest listings ───────────────────────────────────────────────── */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Latest Listings</h2>
            <p className="section-sub">Recently added, verified superbikes</p>
          </div>
          <Link to="/listings" className="btn btn-ghost btn-sm">
            View all {Icons.chevronRight}
          </Link>
        </div>

        <div className="listings-grid">
          {loading
            ? Array(6).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)
            : listings.length === 0
            ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                {Icons.bike}
                <h3>No listings yet</h3>
                <p>Be the first to list your superbike</p>
                <Link to="/dashboard/new" className="btn btn-primary" style={{ marginTop:16 }}>List Your Bike</Link>
              </div>
            )
            : listings.map(l => <ListingCard key={l.id} listing={l} />)
          }
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="how-section">
        <div className="container">
          <div className="section-head" style={{ justifyContent:'center', textAlign:'center', flexDirection:'column', alignItems:'center' }}>
            <h2 className="section-title">How TorqueTrader Works</h2>
            <p className="section-sub">Transparent buying in three simple steps</p>
          </div>
          <div className="how-steps">
            {[
              { n:'01', icon: Icons.search,      title: 'Browse Verified Listings',  body: 'Search by brand, location, price, or engine type. Every listing includes a Transparency Score.' },
              { n:'02', icon: Icons.shield,      title: 'Reveal Seller Contact',      body: 'Sign in once and unlock the seller\'s contact details. No middlemen, no commissions.' },
              { n:'03', icon: Icons.checkCircle, title: 'Meet & Buy Safely',          body: 'Inspect the bike with our checklist. RC, insurance, and service records — all verified upfront.' },
            ].map(({ n, icon, title, body }) => (
              <div key={n} className="how-step">
                <div className="how-step-top">
                  <div className="how-n">{n}</div>
                  <div className="how-icon">{icon}</div>
                </div>
                <h3 className="how-title">{title}</h3>
                <p className="how-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sell CTA ─────────────────────────────────────────────────────── */}
      <section className="section container">
        <div className="sell-cta">
          <div className="sell-cta-text">
            <h3 className="sell-cta-title">Selling your superbike?</h3>
            <p className="sell-cta-body">List for free in under 2 minutes. Reach verified buyers across 30+ cities.</p>
          </div>
          <Link to="/dashboard/new" id="sell-cta-btn" className="btn btn-primary btn-lg">
            List Your Bike for Free {Icons.chevronRight}
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="container footer-inner">
          <div className="footer-logo">Torque<span>Trader</span></div>
          <p className="footer-copy">© 2024 TorqueTrader. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
