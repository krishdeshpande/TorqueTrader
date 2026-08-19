import { Icons } from './Icons';

export default function TermsModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Terms of Service</h2>
            <p className="modal-subtitle">TorqueTrader Superbike Marketplace</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        </div>
        <div className="modal-body legal-content">
          <h3>1. Platform Scope & Verification</h3>
          <p>
            TorqueTrader operates as an enthusiast marketplace connecting verified buyers and private or dealership sellers of high-performance motorcycles in India. While our team performs registration, RC status, and transparency cross-verifications, all physical condition inspections and financial transactions are finalized directly between the buyer and seller.
          </p>
          
          <h3>2. Listing Accuracy & Disclosures</h3>
          <p>
            Sellers are legally obligated to disclose any known structural damage, accidental history, hypothecation status, or non-factory modifications. Falsification of odometer readings or vehicle identity numbers (VIN/Chassis) results in immediate account termination and reporting.
          </p>

          <h3>3. Direct Inquiry & Contact Transparency</h3>
          <p>
            Phone numbers and direct WhatsApp communication channels are unlocked only for authenticated users to protect seller privacy and eliminate unsolicited commercial outreach.
          </p>

          <h3>4. Indian Motor Vehicles Act Compliance</h3>
          <p>
            RC transfer forms (Form 29 and Form 30) must be executed in accordance with local RTO jurisdictional laws. TorqueTrader provides digital checklist templates for convenience.
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
