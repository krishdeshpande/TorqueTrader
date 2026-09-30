import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { Icons } from './Icons';
import './Navbar.css';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function Navbar() {
  const { user, logout, isSeller, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('tt_theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const navigate = useNavigate();

  const consultationRef = useRef(null);
  const profileRef = useRef(null);

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.first_name || user?.email?.split('@')[0] || 'User';

  const displayInitial = (user?.first_name || user?.email || 'U')[0].toUpperCase();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('tt_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileOpen(false);
    setOpenDropdown(null);
  };

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
              <span className="ticker-bullet">{'\u2022'}</span> India's Verified Marketplace & Independent Auto Advisory
            </span>
            <span className="ticker-item hide-mobile">
              <span className="ticker-bullet">{'\u2022'}</span> Full-Spectrum Consulting (Cars & Superbikes)
            </span>
            <span className="ticker-item hide-mobile">
              <span className="ticker-bullet">{'\u2022'}</span> {'100% Unbiased \u00B7 Zero Dealer Kickbacks'}
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

              <NavLink to="/blog" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Blog
              </NavLink>

              <NavLink to="/dashboard/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Sell a Bike
              </NavLink>

              <div className="nav-dropdown-container" ref={consultationRef}>
                <button
                  className="nav-item nav-dropdown-trigger"
                  onClick={() => toggleDropdown('consultation')}
                  aria-haspopup="menu"
                  aria-expanded={openDropdown === 'consultation'}
                >
                  {'Consultation \u25BE'}
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
            </nav>

            {/* Right Action Area: Theme | Book Consultation | Profile */}
            <div className="navbar-actions">
              <button
                className="theme-toggle-btn hide-mobile"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>

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
                    <span className="dropdown-arrow">{'\u25BE'}</span>
                  </button>
                  <div className={`nav-dropdown-menu profile-dropdown-menu ${openDropdown === 'profile' ? 'open' : ''}`} role="menu">
                    <button className="nav-dropdown-item" role="menuitem" onClick={() => { navigate('/profile'); closeDropdown(); }}>
                      Your Profile
                    </button>
                    <NavLink to="/dashboard" className="nav-dropdown-item" role="menuitem" onClick={closeDropdown}>
                      My Dashboard
                    </NavLink>
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
              <div className="mobile-theme-row">
                <span className="mobile-theme-label">Appearance</span>
                <button
                  className="mobile-theme-toggle"
                  onClick={toggleTheme}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? <><MoonIcon /> Dark Mode</> : <><SunIcon /> Light Mode</>}
                </button>
              </div>

              <NavLink to="/listings" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Browse Superbikes
              </NavLink>
              <NavLink to="/blog" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Blog
              </NavLink>
              <NavLink to="/advisor" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Auto Advisory
              </NavLink>
              <NavLink to="/consulting" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                1-on-1 Consultation
              </NavLink>
              {user && (
                <NavLink to="/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  My Dashboard
                </NavLink>
              )}
              <NavLink to="/dashboard/new" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Sell a Bike
              </NavLink>

              {user && (
                <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  Your Profile
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