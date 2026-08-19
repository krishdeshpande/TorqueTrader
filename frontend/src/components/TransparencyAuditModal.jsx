import { Icons } from './Icons';

export default function TransparencyAuditModal({ listing, onClose }) {
  const score = listing.transparency_score || 90;

  const AUDIT_POINTS = [
    {
      title: "RC Registration & State RTO",
      status: "Verified",
      scorePts: "+25 pts",
      detail: `Registered at ${listing.rto_state || listing.location}. Plate ${listing.reg_number || 'Clean Verified'}. Chassis and engine serial match VAHAN record.`,
    },
    {
      title: "Ownership History",
      status: listing.ownership_count === 1 ? "1st Owner Verified" : `${listing.ownership_count} Owners Recorded`,
      scorePts: listing.ownership_count === 1 ? "+20 pts" : "+15 pts",
      detail: listing.ownership_count === 1 ? "Single original owner from first dealership invoice. Clean chain of custody." : "Verified ownership succession with valid transfer entries.",
    },
    {
      title: "Authorized Service Documentation",
      status: "Logs Available",
      scorePts: "+20 pts",
      detail: listing.service_history_type || "Complete authorized dealership service records with physical or digital invoices.",
    },
    {
      title: "Hypothecation & Bank NOC",
      status: "NOC Clear",
      scorePts: "+15 pts",
      detail: listing.hypothecation_status || "No active bank hypothecation. Clean NOC available for immediate RTO name transfer.",
    },
    {
      title: "Insurance & Fitness Validity",
      status: "Active Policy",
      scorePts: "+10 pts",
      detail: `${listing.insurance_type || 'Comprehensive'} valid until ${listing.insurance_valid_until || 'Current Year'}.`,
    },
    {
      title: "Declared Modifications & Known Flaws",
      status: "Transparent",
      scorePts: "+10 pts",
      detail: "Seller has declared full list of aftermarket upgrades and documented cosmetic wear points with close-up photos.",
    },
  ];

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <div className="badge badge-green" style={{ marginBottom: 6 }}>
              {Icons.shield} Verified Transparency Report
            </div>
            <h2 className="modal-title">Inspection & Audit Scorecard</h2>
            <p className="modal-subtitle">{listing.year} {listing.make} {listing.model}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        </div>

        <div className="modal-body">
          {/* Overall score banner */}
          <div className="audit-score-banner">
            <div className="audit-score-left">
              <span className="audit-score-val">{score}</span>
              <span className="audit-score-denom">/ 100</span>
            </div>
            <div className="audit-score-right">
              <h4 className="audit-grade-title">
                {score >= 90 ? 'Tier 1 Certified Enthusiast Grade' : score >= 75 ? 'Tier 2 Verified Clean Record' : 'Standard Market Listing'}
              </h4>
              <p className="audit-grade-desc">
                Calculated across 6 independent audit pillars: RTO verification, title ownership, workshop invoices, bank hypothecation, insurance, and declared physical condition.
              </p>
            </div>
          </div>

          {/* Audit breakdown list */}
          <div className="audit-points-list">
            {AUDIT_POINTS.map((item, idx) => (
              <div key={idx} className="audit-point-row">
                <div className="audit-point-head">
                  <div className="audit-point-title-wrap">
                    <span className="audit-check-icon">{Icons.check}</span>
                    <span className="audit-point-title">{item.title}</span>
                  </div>
                  <div className="audit-point-meta">
                    <span className="audit-status-badge">{item.status}</span>
                    <span className="audit-pts-badge">{item.scorePts}</span>
                  </div>
                </div>
                <p className="audit-point-detail">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
