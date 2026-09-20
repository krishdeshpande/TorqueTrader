import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { Icons } from './Icons';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isSeller, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <>
      <header className="navbar-root">
        {/* Top utility ticker */}
        <div className="navbar-top-ticker">
          <div className="container ticker-inner">
            <span className="ticker-item">
              <span className="ticker-bullet">•</span> India's Verified Marketplace & Independent Auto Advisory
            </span>
            <span className="ticker-item hide-mobile">
              <span className="ticker-bullet">•</span> Full-Spectrum Consulting (Cars & Superbikes)
            </span>
            <span className="ticker-item hide-mobile">
              <span className="ticker-bullet">•</span> 100% Unbiased · Zero Dealer Kickbacks
            </span>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="navbar-main">
          <div className="container navbar-container">
            {/* Logo */}
            <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
              <span className="brand-logo-text">TORQUE<span className="brand-accent">TRADER</span></span>
              <span className="brand-tagline">AUTOMOTIVE ADVISORY & MARKETPLACE</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="navbar-links">
              <NavLink to="/listings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Browse Superbikes
              </NavLink>
              <NavLink to="/advisor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Auto Advisory
              </NavLink>
              <NavLink to="/consulting" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                1-on-1 Consulting
              </NavLink>
              <NavLink to="/dashboard/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Sell a Bike
              </NavLink>
              {(isSeller || isAdmin || user) && (
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  My Dashboard
                </NavLink>
              )}
            </nav>

            {/* Right Action Area */}
            <div className="navbar-actions">
              <Link to="/consulting" className="btn btn-secondary btn-sm hide-mobile">
                Book Consultation
              </Link>

              {user ? (
                <div className="user-profile-menu">
                  <span className="user-email-chip">
                    <span className="user-avatar-initial">{user.email ? user.email[0].toUpperCase() : 'U'}</span>
                    <span className="user-email-text">{user.email ? user.email.split('@')[0] : 'User'}</span>
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign Out">
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  id="nav-signin-btn"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAuth(true)}
                >
                  Sign In
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                className="mobile-toggle-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? Icons.close : Icons.filter}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileOpen && (
          <div className="mobile-nav-panel">
            <div className="container mobile-nav-inner">
              <NavLink to="/listings" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Browse Superbikes
              </NavLink>
              <NavLink to="/advisor" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Auto Advisory (AI Intelligence)
              </NavLink>
              <NavLink to="/consulting" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                1-on-1 Personalized Consulting
              </NavLink>
              <NavLink to="/dashboard/new" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Sell a Bike (mParivahan Autofill)
              </NavLink>
              {user && (
                <NavLink to="/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  My Dashboard
                </NavLink>
              )}
              <div className="mobile-nav-divider" />
              {user ? (
                <button className="mobile-nav-link text-danger" onClick={handleLogout}>
                  Sign Out ({user.email})
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => { setMobileOpen(false); setShowAuth(true); }}
                >
                  Sign In to TorqueTrader
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
