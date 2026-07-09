import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { Icons } from './Icons';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner container">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
            <span className="logo-word">Torque</span><span className="logo-accent">Trader</span>
          </Link>

          {/* Desktop links */}
          <div className="navbar-links">
            <NavLink to="/listings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Browse Bikes
            </NavLink>
            {(isSeller || isAdmin) && (
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                My Listings
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link nav-admin ${isActive ? 'active' : ''}`}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Desktop actions */}
          <div className="navbar-actions">
            {user ? (
              <div className="user-area">
                <Link to="/dashboard/new" className="btn btn-secondary btn-sm">
                  {Icons.plus} Sell Your Bike
                </Link>
                <div className="user-dropdown-wrap">
                  <button className="user-chip">
                    <span className="user-avatar">{user.email?.[0]?.toUpperCase() ?? 'U'}</span>
                    <span className="user-email">{user.email?.split('@')[0]}</span>
                    {Icons.chevronDown}
                  </button>
                  <div className="user-dropdown">
                    <Link to="/dashboard" className="dropdown-item">My Dashboard</Link>
                    <Link to="/dashboard/new" className="dropdown-item">New Listing</Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      {Icons.logout} Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-btns">
                <Link to="/listings" className="btn btn-ghost btn-sm">Sell Your Bike</Link>
                <button id="nav-signin-btn" className="btn btn-primary btn-sm" onClick={() => setShowAuth(true)}>
                  Sign In
                </button>
              </div>
            )}

            {/* Hamburger */}
            <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to="/listings" className="mobile-link" onClick={() => setMenuOpen(false)}>Browse Bikes</NavLink>
            {(isSeller || isAdmin) && (
              <NavLink to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>My Listings</NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)}>Admin</NavLink>
            )}
            <div className="mobile-divider" />
            {user ? (
              <>
                <NavLink to="/dashboard/new" className="mobile-link" onClick={() => setMenuOpen(false)}>+ Sell Your Bike</NavLink>
                <button className="mobile-link mobile-logout" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <button className="mobile-link mobile-signin" onClick={() => { setMenuOpen(false); setShowAuth(true); }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
