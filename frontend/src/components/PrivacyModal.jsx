import { Icons } from './Icons';

export default function PrivacyModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Privacy Policy</h2>
            <p className="modal-subtitle">Data Protection & Privacy Notice</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        </div>
        <div className="modal-body legal-content">
          <h3>1. Information Collection</h3>
          <p>
            TorqueTrader collects user email addresses via passwordless one-time passcodes (OTP) for authentication. When listing a superbike, vehicle registration details and uploaded documentation are securely processed for verification purposes.
          </p>

          <h3>2. Zero Spam Guarantee</h3>
          <p>
            We do not sell, rent, or distribute personal contact information to third-party marketing brokers. Seller contact numbers are protected behind authenticated one-click reveal protocols.
          </p>

          <h3>3. Data Security</h3>
          <p>
            All network communication operates over encrypted TLS 1.3 channels. Sensitive credentials, verification logs, and database records are isolated with strict role-based access control.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
