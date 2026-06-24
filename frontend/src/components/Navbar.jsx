import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Torque<span className="logo-accent">Trader</span></span>
          </Link>

          <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            <Link to="/listings" className="nav-link" onClick={() => setMenuOpen(false)}>Browse Bikes</Link>
            {(isSeller || isAdmin) && (
              <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="nav-link nav-link-admin" onClick={() => setMenuOpen(false)}>Admin</Link>
            )}
          </div>

          <div className="navbar-actions">
            {user ? (
              <div className="user-menu">
                <div className="user-avatar" title={user.email}>
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" id="nav-login-btn" onClick={() => setShowAuth(true)}>
                Sign In
              </button>
            )}
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
