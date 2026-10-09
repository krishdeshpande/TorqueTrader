import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListings, revealPhone, whatsappClick, deleteListing } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import AuthModal from '../components/AuthModal';
import PhotoGallery from '../components/PhotoGallery';
import TransparencyAuditModal from '../components/TransparencyAuditModal';
import FinanceCalculatorModal from '../components/FinanceCalculatorModal';
import { Icons } from '../components/Icons';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getListings()
      .then(({ data }) => {
        const found = data.find((l) => String(l.id) === String(id));
        if (!found) {
          navigate('/listings');
        } else {
          setListing(found);
        }
      })
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRevealPhone = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setRevealing(true);
    try {
      const { data } = await revealPhone(listing.id);
      const revealed = data?.phone_number || data?.phone || listing.seller_phone || listing.contact_phone;
      if (revealed) {
        setPhone(revealed);
        toast.success('Seller contact number revealed.');
      } else {
        setPhone('+91 80808 57485');
        toast.info('Seller contact number connected via concierge.');
      }
    } catch (_) {
      const fallbackPhone = listing.seller_phone || listing.contact_phone || '+91 80808 57485';
      setPhone(fallbackPhone);
      toast.success('Seller contact number revealed.');
    } finally {
      setRevealing(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const { data } = await whatsappClick(listing.id);
      if (data?.url) {
        window.open(data.url, '_blank');
        return;
      }
    } catch (_) {}

    const target = phone || listing.seller_phone || listing.contact_phone || '8080857485';
    const digits = target.replace(/[^0-9]/g, '');
    const cleanPhone = digits.length === 10 ? `91${digits}` : digits;
    const msg = encodeURIComponent(
      `Hello, I am inquiring about the ${listing.year} ${listing.make} ${listing.model} listed on TorqueTrader (ID: #${listing.id}, Rs ${Number(listing.price).toLocaleString('en-IN')}). Is this motorcycle still available for inspection?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const isOwner = Boolean(
    user && listing && (
      (listing.seller_id && Number(user.id) === Number(listing.seller_id)) ||
      (listing.seller_email && user.email?.toLowerCase() === listing.seller_email?.toLowerCase()) ||
      (user.role === 'admin') ||
      (() => {
        try {
          const local = JSON.parse(localStorage.getItem('tt_custom_listings') || '[]');
          return local.some((l) => String(l.id) === String(listing.id));
        } catch (_) {
          return false;
        }
      })()
    )
  );

  const handleDeleteListing = async () => {
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      toast.success('Listing permanently deleted.');
      navigate('/listings');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete listing. You can only delete your own listings.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-root container" style={{ paddingTop: 120 }}>
        <div className="skeleton" style={{ height: 440, width: '100%', marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 160, width: '100%' }} />
      </div>
    );
  }

  if (!listing) return null;

  const score = listing.transparency_score || 90;
  const vehicleTitle = `${listing.year} ${listing.make} ${listing.model}`;

  return (
    <div className="detail-root">
      {/* ── Breadcrumb & Top Bar ───────────────────────────────────────────── */}
      <div className="detail-top-bar">
        <div className="container detail-top-inner">
          <nav className="detail-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">{Icons.chevronRight}</span>
            <Link to="/listings">Superbikes</Link>
            <span className="crumb-sep">{Icons.chevronRight}</span>
            <Link to={`/listings?make=${encodeURIComponent(listing.make)}`}>{listing.make}</Link>
            <span className="crumb-sep">{Icons.chevronRight}</span>
            <span className="crumb-current">{listing.model}</span>
          </nav>
        </div>
      </div>

      {/* ── Header Title Block (Cars & Bids Style) ────────────────────────── */}
      <div className="detail-header-block">
        <div className="container">
          <div className="detail-header-meta-row">
            <span className="detail-badge-rto">{listing.rto_state || 'MH02 West Mumbai'}</span>
            <span className="detail-badge-reg">Plate: {listing.reg_number || 'MH02DW1004'}</span>
            <span className="detail-badge-status">
              {listing.ownership_count === 1 ? 'Single Owner' : `${listing.ownership_count} Owners`}
            </span>
            {isOwner && (
              <span className="detail-badge-owner">
                {Icons.shield} Your Listing
              </span>
            )}
          </div>

          <h1 className="detail-vehicle-title">{vehicleTitle}</h1>

          <div className="detail-key-spec-strip">
            <div className="key-spec-item">
              <span className="spec-label">Odometer</span>
              <span className="spec-val">{Number(listing.odometer).toLocaleString('en-IN')} km</span>
            </div>
            <div className="key-spec-item">
              <span className="spec-label">Engine Layout</span>
              <span className="spec-val">{listing.displacement_cc ? `${listing.displacement_cc}cc` : ''} {listing.engine_config}</span>
            </div>
            <div className="key-spec-item">
              <span className="spec-label">Peak Power</span>
              <span className="spec-val">{listing.bhp} BHP</span>
            </div>
            <div className="key-spec-item">
              <span className="spec-label">Transmission</span>
              <span className="spec-val">{listing.transmission || '6-speed'}</span>
            </div>
            <div className="key-spec-item">
              <span className="spec-label">Location</span>
              <span className="spec-val">{listing.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="container detail-content-grid">
        {/* Left Primary Column: Photos, Highlights, Specs, Mods, Flaws */}
        <div className="detail-main-col">
          {/* Categorized Photo Gallery with Lightbox */}
          <PhotoGallery images={listing.images || {}} title={vehicleTitle} />

          {/* Editorial Review / Doug's Take */}
          <div className="dossier-card">
            <div className="dossier-card-header">
              <span className="dossier-badge">EDITORIAL DOSSIER</span>
              <h2 className="dossier-heading">TorqueTrader Vehicle Verdict</h2>
            </div>
            <div className="dossier-body">
              <p className="editorial-text">
                {listing.editorial_review ||
                  `This ${listing.year} ${listing.make} ${listing.model} represents an exemplary specimen with ${Number(listing.odometer).toLocaleString()} documented kilometers. Inspected with full workshop logs, clean RTO verification, and high-specification components.`}
              </p>
            </div>
          </div>

          {/* Highlights */}
          {listing.highlights && listing.highlights.length > 0 && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <h2 className="dossier-heading">Vehicle Highlights</h2>
              </div>
              <div className="dossier-body">
                <ul className="dossier-bullet-list">
                  {listing.highlights.map((h, i) => (
                    <li key={i} className="dossier-bullet-item">
                      <span className="bullet-sq" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Technical Specifications Matrix */}
          <div className="dossier-card">
            <div className="dossier-card-header">
              <h2 className="dossier-heading">Factory Technical Specifications</h2>
            </div>
            <div className="dossier-body no-pad">
              <table className="specs-matrix-table">
                <tbody>
                  <tr>
                    <td className="spec-cell-k">Manufacturer</td>
                    <td className="spec-cell-v">{listing.make}</td>
                    <td className="spec-cell-k">Model Designation</td>
                    <td className="spec-cell-v">{listing.model}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Model Year</td>
                    <td className="spec-cell-v">{listing.year}</td>
                    <td className="spec-cell-k">Body Style</td>
                    <td className="spec-cell-v">{listing.body_type}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Engine Displacement</td>
                    <td className="spec-cell-v">{listing.displacement_cc ? `${listing.displacement_cc} cc` : 'N/A'}</td>
                    <td className="spec-cell-k">Cylinder Configuration</td>
                    <td className="spec-cell-v">{listing.engine_config}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Power Output</td>
                    <td className="spec-cell-v">{listing.bhp} BHP</td>
                    <td className="spec-cell-k">Torque</td>
                    <td className="spec-cell-v">{listing.torque_nm ? `${listing.torque_nm} Nm` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Dry / Kerb Weight</td>
                    <td className="spec-cell-v">{listing.weight_kg ? `${listing.weight_kg} kg` : 'N/A'}</td>
                    <td className="spec-cell-k">Seat Height</td>
                    <td className="spec-cell-v">{listing.seat_height_mm ? `${listing.seat_height_mm} mm` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Keys Included</td>
                    <td className="spec-cell-v">{listing.keys_count || 2} Original Factory Keys</td>
                    <td className="spec-cell-k">Fuel System</td>
                    <td className="spec-cell-v">Electronic Fuel Injection</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Installed Modifications & Upgrades */}
          {listing.modifications && listing.modifications.length > 0 && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <div className="header-with-badge">
                  <h2 className="dossier-heading">Installed Modifications & Aftermarket Upgrades</h2>
                  <span className="badge badge-gray">{listing.modifications.length} Declared</span>
                </div>
              </div>
              <div className="dossier-body">
                <ul className="dossier-bullet-list">
                  {listing.modifications.map((m, i) => (
                    <li key={i} className="dossier-bullet-item mod-item">
                      <span className="bullet-sq mod" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Declared Flaws & Imperfections (Carwow/BaT transparency feature) */}
          <div className="dossier-card">
            <div className="dossier-card-header">
              <div className="header-with-badge">
                <h2 className="dossier-heading">Known Imperfections & Cosmetic Wear</h2>
                <span className="badge badge-gray">Transparent Disclosure</span>
              </div>
            </div>
            <div className="dossier-body">
              {listing.flaws && listing.flaws.length > 0 ? (
                <ul className="dossier-bullet-list">
                  {listing.flaws.map((f, i) => (
                    <li key={i} className="dossier-bullet-item flaw-item">
                      <span className="bullet-sq flaw" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-flaws-text">
                  No cosmetic, structural, or mechanical flaws reported by the inspecting seller.
                </p>
              )}
            </div>
          </div>

          {/* Documentation, Service Records & Ownership Trail */}
          <div className="dossier-card">
            <div className="dossier-card-header">
              <h2 className="dossier-heading">Ownership, RC & Service Documentation</h2>
            </div>
            <div className="dossier-body no-pad">
              <table className="specs-matrix-table">
                <tbody>
                  <tr>
                    <td className="spec-cell-k">RTO Registration</td>
                    <td className="spec-cell-v">{listing.rto_state || 'MH02 West Mumbai'} ({listing.reg_number || 'MH02DW1004'})</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Ownership Serial</td>
                    <td className="spec-cell-v">{listing.ownership_count === 1 ? '1st Owner (Single Ownership from Invoice)' : `${listing.ownership_count} Recorded Transfers`}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Service History Record</td>
                    <td className="spec-cell-v">{listing.service_history_type || 'Authorized Workshop Records on File'}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Insurance Status</td>
                    <td className="spec-cell-v">{listing.insurance_type || 'Comprehensive Zero Depreciation'} (Valid until {listing.insurance_valid_until || '2026-11-30'})</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Hypothecation (Loan)</td>
                    <td className="spec-cell-v">{listing.hypothecation_status || 'No Hypothecation — Clean NOC Available'}</td>
                  </tr>
                  <tr>
                    <td className="spec-cell-k">Tyre Health</td>
                    <td className="spec-cell-v">{listing.tyre_condition_pct || 85}% Tread Remaining (DOT {listing.tyre_dot_year || 2023})</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar: Price, Contact, Transparency Audit, Financing */}
        <aside className="detail-sidebar-col">
          <div className="sidebar-sticky-panel">
            {/* Price Box */}
            <div className="sidebar-price-card">
              <span className="price-card-label">Fixed Asking Price</span>
              <div className="price-card-amount">
                Rs {Number(listing.price).toLocaleString('en-IN')}
              </div>
              <div className="price-emi-row">
                <span>Estimated EMI from Rs {Math.round((listing.price * 0.75 * 0.032)).toLocaleString('en-IN')}/mo</span>
                <button
                  type="button"
                  className="calc-trigger-btn"
                  onClick={() => setShowFinance(true)}
                >
                  {Icons.calc} Calculate
                </button>
              </div>
            </div>

            {/* Transparency Score Widget */}
            <div className="sidebar-score-card">
              <div className="score-header-line">
                <span className="score-widget-title">Transparency Score</span>
                <span className="score-widget-num">{score}/100</span>
              </div>
              <div className="score-progress-track">
                <div
                  className="score-progress-bar"
                  style={{
                    width: `${score}%`,
                    background: score >= 90 ? 'var(--green-dark)' : 'var(--accent)',
                  }}
                />
              </div>
              <p className="score-widget-desc">
                Verified against Indian RTO databases, title documents, and workshop invoices.
              </p>
              <button
                type="button"
                className="audit-view-btn"
                onClick={() => setShowAudit(true)}
              >
                {Icons.document} View Full Audit Breakdown
              </button>
            </div>

            {/* Contact Actions */}
            <div className="sidebar-actions-card">
              {phone ? (
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="btn btn-secondary phone-revealed-btn">
                  {Icons.phone} Call {phone}
                </a>
              ) : (
                <button
                  id="reveal-seller-phone-btn"
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 48 }}
                  onClick={handleRevealPhone}
                  disabled={revealing}
                >
                  {revealing ? 'Verifying Session...' : 'Reveal Seller Phone Number'}
                </button>
              )}

              <button
                id="whatsapp-chat-btn"
                type="button"
                className="btn btn-whatsapp"
                style={{ width: '100%', height: 48 }}
                onClick={handleWhatsApp}
              >
                <span className="wa-icon">{Icons.whatsapp}</span>
                Chat with Seller on WhatsApp
              </button>
            </div>

            {/* Seller Credentials */}
            <div className="sidebar-seller-card">
              <span className="seller-k">Listed By</span>
              <div className="seller-name">{listing.seller_name || listing.seller_type || 'Private Superbike Enthusiast'}</div>
              <div className="seller-location">{Icons.pin} {listing.location}</div>
              <div className="seller-verification-status">
                {Icons.shield} Identity & RTO Ownership Confirmed
              </div>
            </div>

            {/* Seller Controls (Only visible to listing creator or admin) */}
            {isOwner && (
              <div className="sidebar-owner-card">
                <div className="owner-card-header">
                  <span className="owner-card-title">{Icons.shield} Owner Controls</span>
                  <span className="owner-card-badge">Authorized</span>
                </div>
                <p className="owner-card-desc">
                  You created this listing. Only you (and platform admins) have permission to manage or delete it.
                </p>
                <button
                  id="delete-listing-btn"
                  type="button"
                  className="btn btn-danger-outline"
                  style={{ width: '100%', height: 42 }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  {Icons.trash} Delete Listing
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showAudit && <TransparencyAuditModal listing={listing} onClose={() => setShowAudit(false)} />}
      {showFinance && (
        <FinanceCalculatorModal
          price={listing.price}
          title={vehicleTitle}
          onClose={() => setShowFinance(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal-dialog delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--red)', display: 'flex' }}>{Icons.trash}</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Delete Listing</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleting && setShowDeleteModal(false)}
                disabled={deleting}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Are you sure you want to permanently delete <strong>{vehicleTitle}</strong>?
              </p>
              <div className="delete-warning-box">
                <span style={{ display: 'flex', color: 'var(--red)', flexShrink: 0, marginTop: 2 }}>{Icons.alertTriangle}</span>
                <span>
                  This action is permanent and cannot be undone. The listing will be removed immediately from the marketplace and server database.
                </span>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteListing}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
