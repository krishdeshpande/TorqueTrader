import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { Icons } from './Icons';
import './Navbar.css';

const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();

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

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.email?.split('@')[0] || 'User';

  const displayInitial = (
    user?.first_name || user?.email || 'U'
  )[0].toUpperCase();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem('tt_theme', theme);
    } catch {
      // Local storage may be unavailable.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideConsultation =
        !consultationRef.current?.contains(event.target);

      const clickedOutsideProfile =
        !profileRef.current?.contains(event.target);

      if (clickedOutsideConsultation && clickedOutsideProfile) {
        setOpenDropdown(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
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

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header className="navbar-root">
        {/* Top utility ticker */}
        <div className="navbar-top-ticker">
          <div className="container ticker-inner">
            <span className="ticker-item">
              <span className="ticker-bullet">{'\u2022'}</span>{' '}
              India's Verified Marketplace & Independent Auto Advisory
            </span>

            <span className="ticker-item hide-mobile">
              <span className="ticker-bullet">{'\u2022'}</span>{' '}
              Full-Spectrum Consulting (Cars & Superbikes)
            </span>

            <span className="ticker-item hide-mobile">
              <span className="ticker-bullet">{'\u2022'}</span>{' '}
              {'100% Unbiased \u00B7 Zero Dealer Kickbacks'}
            </span>
          </div>
        </div>

        {/* Main navigation */}
        <div className="navbar-main">
          <div className="container navbar-container">
            {/* Logo */}
            <Link
              to="/"
              className="navbar-brand"
              onClick={closeMobileMenu}
            >
              <span className="brand-logo-text">
                TORQUE<span className="brand-accent">TRADER</span>
              </span>

              <span className="brand-tagline">
                AUTOMOTIVE ADVISORY & MARKETPLACE
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav className="navbar-links">
              {/* 1. Browse Superbikes */}
              <NavLink
                to="/listings"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                Browse Superbikes
              </NavLink>

              {/* 2. Sell a Bike */}
              <NavLink
                to="/dashboard/new"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                Sell a Bike
              </NavLink>

              {/* 3. Blog */}
              <NavLink
                to="/blog"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                Blog
              </NavLink>

              {/* 4. Consultation dropdown */}
              <div
                className="nav-dropdown-container"
                ref={consultationRef}
              >
                <button
                  type="button"
                  className="nav-item nav-dropdown-trigger"
                  onClick={() => toggleDropdown('consultation')}
                  aria-haspopup="menu"
                  aria-expanded={openDropdown === 'consultation'}
                >
                  Consultation {'\u25BE'}
                </button>

                <div
                  className={`nav-dropdown-menu ${
                    openDropdown === 'consultation' ? 'open' : ''
                  }`}
                  role="menu"
                >
                  <NavLink
                    to="/advisor"
                    className="nav-dropdown-item"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    Auto Advisory
                  </NavLink>

                  <NavLink
                    to="/consulting"
                    className="nav-dropdown-item"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    1-on-1 Consultation
                  </NavLink>
                </div>
              </div>

              {/* 5. Group Buying */}
              <NavLink
                to="/group-buying"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                Group Buying{' '}
                <span className="nav-pulse-badge">Pool & Save</span>
              </NavLink>
            </nav>

            {/* Right-side actions */}
            <div className="navbar-actions">
              {/* Theme toggle */}
              <button
                type="button"
                className="theme-toggle-btn hide-mobile"
                onClick={toggleTheme}
                aria-label={
                  theme === 'light'
                    ? 'Switch to dark mode'
                    : 'Switch to light mode'
                }
                title={
                  theme === 'light'
                    ? 'Switch to dark mode'
                    : 'Switch to light mode'
                }
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>

              {/* Book Consultation */}
              <Link
                to="/consulting"
                className="btn btn-secondary btn-sm hide-mobile"
              >
                Book Consultation
              </Link>

              {/* Profile or Sign In */}
              {user ? (
                <div className="user-profile-menu" ref={profileRef}>
                  <button
                    type="button"
                    className="user-profile-chip"
                    onClick={() => toggleDropdown('profile')}
                    aria-haspopup="menu"
                    aria-expanded={openDropdown === 'profile'}
                  >
                    <span className="user-avatar-initial">
                      {displayInitial}
                    </span>

                    <span className="user-profile-text">
                      {displayName}
                    </span>

                    <span className="dropdown-arrow">
                      {'\u25BE'}
                    </span>
                  </button>

                  <div
                    className={`nav-dropdown-menu profile-dropdown-menu ${
                      openDropdown === 'profile' ? 'open' : ''
                    }`}
                    role="menu"
                  >
                    <button
                      type="button"
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        navigate('/profile');
                        closeDropdown();
                      }}
                    >
                      Your Profile
                    </button>

                    <NavLink
                      to="/dashboard"
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      My Dashboard
                    </NavLink>

                    <button
                      type="button"
                      className="nav-dropdown-item sign-out-item"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="nav-signin-btn"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAuth(true)}
                >
                  Sign In
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                className="mobile-toggle-btn"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? Icons.close : Icons.filter}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {mobileOpen && (
          <div className="mobile-nav-panel">
            <div className="container mobile-nav-inner">
              {/* Appearance */}
              <div className="mobile-theme-row">
                <span className="mobile-theme-label">Appearance</span>

                <button
                  type="button"
                  className="mobile-theme-toggle"
                  onClick={toggleTheme}
                  aria-label={
                    theme === 'light'
                      ? 'Switch to dark mode'
                      : 'Switch to light mode'
                  }
                >
                  {theme === 'light' ? (
                    <>
                      <MoonIcon /> Dark Mode
                    </>
                  ) : (
                    <>
                      <SunIcon /> Light Mode
                    </>
                  )}
                </button>
              </div>

              {/* 1. Browse Superbikes */}
              <NavLink
                to="/listings"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Browse Superbikes
              </NavLink>

              {/* 2. Sell a Bike */}
              <NavLink
                to="/dashboard/new"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Sell a Bike
              </NavLink>

              {/* 3. Blog */}
              <NavLink
                to="/blog"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Blog
              </NavLink>

              {/* 4. Consultation options */}
              <NavLink
                to="/advisor"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Auto Advisory
              </NavLink>

              <NavLink
                to="/consulting"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                1-on-1 Consultation
              </NavLink>

              {/* 5. Group Buying */}
              <NavLink
                to="/group-buying"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Group Buying (Pool & Save)
              </NavLink>

              {/* Account links */}
              {user && (
                <NavLink
                  to="/dashboard"
                  className="mobile-nav-link"
                  onClick={closeMobileMenu}
                >
                  My Dashboard
                </NavLink>
              )}

              {user && (
                <NavLink
                  to="/profile"
                  className="mobile-nav-link"
                  onClick={closeMobileMenu}
                >
                  Your Profile
                </NavLink>
              )}

              <div className="mobile-nav-divider" />

              {/* Authentication */}
              {user ? (
                <button
                  type="button"
                  className="mobile-nav-link text-danger"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => {
                    setMobileOpen(false);
                    setShowAuth(true);
                  }}
                >
                  Sign In to TorqueTrader
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}