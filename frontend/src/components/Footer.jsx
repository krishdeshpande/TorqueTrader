import { useState } from 'react';
import { Link } from 'react-router-dom';
import FeedbackSection from './FeedbackSection';
import TermsModal from './TermsModal';
import PrivacyModal from './PrivacyModal';
import './Footer.css';

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <FeedbackSection />

      <footer className="global-footer-root">
        <div className="container footer-content-grid">
          <div className="footer-col-main">
            <div className="footer-brand-title">TORQUE<span>TRADER</span></div>
            <p className="footer-brand-desc">
              India's transparent marketplace for verified high-performance motorcycles and independent automotive advisory. Built for enthusiasts, backed by official registration data.
            </p>
            <div className="footer-rto-note">
              Operating across Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Pune, and all Indian RTO jurisdictions.
            </div>
          </div>

          <div className="footer-col-nav">
            <h4 className="footer-heading">Marketplace & Advisory</h4>
            <Link to="/listings" className="footer-link">Browse Superbikes</Link>
            <Link to="/advisor" className="footer-link">AI Auto Advisory</Link>
            <Link to="/consulting" className="footer-link">1-on-1 Consulting</Link>
            <Link to="/dashboard/new" className="footer-link">Sell Your Motorcycle</Link>
            <Link to="/dashboard" className="footer-link">Seller Dashboard</Link>
          </div>

          <div className="footer-col-nav">
            <h4 className="footer-heading">Legal & Standards</h4>
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
          <span>Zero Commission Classified Platform · 100% Unbiased Advisory</span>
        </div>
      </footer>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  );
}
