import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { Icons } from './Icons';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isSeller, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'consultation' | 'profile' | null
  const navigate = useNavigate();

  const consultationRef = useRef(null);
  const profileRef = useRef(null);

  // Safe fallbacks for user display name and initial
  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.first_name || user?.email?.split('@')[0] || 'User';

  const displayInitial = (user?.first_name || user?.email || 'U')[0].toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (consultationRef.current && !consultationRef.current.contains(e.target)) &&
        (profileRef.current && !profileRef.current.contains(e.target))
      ) {
        setOpenDropdown(null);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openDropdown]);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
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

              {/* Consultation Dropdown */}
              <div className="nav-dropdown-container" ref={consultationRef}>
                <button
                  className="nav-item nav-dropdown-trigger"
                  onClick={() => toggleDropdown('consultation')}
                  aria-haspopup="menu"
                  aria-expanded={openDropdown === 'consultation'}
                >
                  Consultation <span className="dropdown-arrow">▾</span>
                </button>
                <div className={`nav-dropdown-menu ${openDropdown === 'consultation' ? 'open' : ''}`} role="menu">
                  <NavLink to="/advisor" className="nav-dropdown-item" role="menuitem" onClick={closeDropdown}>
                    Auto Advisory
                  </NavLink>
                  <NavLink to="/consulting" className="nav-dropdown-item" role="menuitem" onClick={closeDropdown}>
                    1-on-1 Consultation
                  </NavLink>
                </div>
              </div>

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
                <div className="user-profile-menu" ref={profileRef}>
                  <button
                    className="user-profile-chip"
                    onClick={() => toggleDropdown('profile')}
                    aria-haspopup="menu"
                    aria-expanded={openDropdown === 'profile'}
                  >
                    <span className="user-avatar-initial">{displayInitial}</span>
                    <span className="user-profile-text">{displayName}</span>
                    <span className="dropdown-arrow">▾</span>
                  </button>
                  <div className={`nav-dropdown-menu profile-dropdown-menu ${openDropdown === 'profile' ? 'open' : ''}`} role="menu">
                    <button className="nav-dropdown-item" role="menuitem" onClick={() => { navigate('/profile'); closeDropdown(); }}>
                      Your Profile
                    </button>
                    <button className="nav-dropdown-item sign-out-item" role="menuitem" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
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

              {user && (
                <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  Your Profile ({displayName})
                </NavLink>
              )}

              <div className="mobile-nav-divider" />
              {user ? (
                <button className="mobile-nav-link text-danger" onClick={handleLogout}>
                  Sign Out
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
