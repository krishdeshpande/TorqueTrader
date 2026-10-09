import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { getListings, getConsultations, deleteListing } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine');
  const [listingToDelete, setListingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      getListings().catch(() => ({ data: [] })),
      getConsultations().catch(() => [])
    ])
      .then(([listingsRes, consultsRes]) => {
        setListings(listingsRes.data || []);
        setConsultations(consultsRes || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="dash-root container" style={{ paddingTop: 120 }}>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isListingOwner = (l) => {
    if (!user || !l) return false;
    if (user.role === 'admin') return true;
    if (l.seller_id && Number(user.id) === Number(l.seller_id)) return true;
    if (l.seller_email && user.email?.toLowerCase() === l.seller_email?.toLowerCase()) return true;
    try {
      const local = JSON.parse(localStorage.getItem('tt_custom_listings') || '[]');
      return local.some((item) => String(item.id) === String(l.id));
    } catch (_) {
      return false;
    }
  };

  const myListings = listings.filter(isListingOwner);

  const counts = {
    total: listings.length,
    mine: myListings.length,
    active: listings.filter((l) => l.status === 'active').length,
    consultations: consultations.length,
    verified: listings.filter((l) => (l.transparency_score || 0) >= 90).length,
  };

  const filtered = activeTab === 'all'
    ? listings
    : activeTab === 'mine'
    ? myListings
    : activeTab === 'active'
    ? listings.filter((l) => l.status === 'active')
    : [];

  return (
    <div className="dash-root">
      {/* Top Banner */}
      <div className="dash-top-bar">
        <div className="container dash-top-inner">
          <div>
            <span className="dash-eyebrow">SELLER & CONSULTING CONSOLE</span>
            <h1 className="dash-main-title">Management Dashboard</h1>
            <p className="dash-subtext">
              Authenticated as <span className="dash-email-tag">{user.email}</span> · Verified Seller & Automotive Consultant
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/consulting" className="btn btn-secondary">
              View Consulting Tiers
            </Link>
            <Link to="/dashboard/new" className="btn btn-primary">
              {Icons.plus} List a Superbike
            </Link>
          </div>
        </div>
      </div>

      <div className="container dash-content-layout">
        {/* Stats Row */}
        <div className="dash-stats-row">
          <div className="dash-stat-card">
            <span className="stat-label">Consultation Requests</span>
            <div className="stat-val" style={{ color: 'var(--accent)' }}>{counts.consultations}</div>
            <span className="stat-sub">Paid 1-on-1 Advisory Leads</span>
          </div>

          <div className="dash-stat-card">
            <span className="stat-label">Active Listings</span>
            <div className="stat-val">{counts.total}</div>
            <span className="stat-sub">Live on Marketplace</span>
          </div>

          <div className="dash-stat-card">
            <span className="stat-label">mParivahan Verified</span>
            <div className="stat-val">{counts.verified}</div>
            <span className="stat-sub">90+ Transparency Score</span>
          </div>

          <div className="dash-stat-card">
            <span className="stat-label">Advisory Status</span>
            <div className="stat-val" style={{ color: 'var(--green-dark)' }}>Online</div>
            <span className="stat-sub">AI & Direct Consulting Ready</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dash-tabs-bar">
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My Listings ({counts.mine})
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultations')}
          >
            Consultation Bookings ({counts.consultations})
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Inventory ({counts.total})
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active & Verified ({counts.active})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'consultations' ? (
          consultations.length === 0 ? (
            <div className="dash-empty-box">
              <h3>No Consultation Bookings Yet</h3>
              <p>When buyers request 1-on-1 strategy calls or ad audits on the consulting page, they appear here.</p>
              <Link to="/consulting" className="btn btn-primary" style={{ marginTop: 14 }}>
                Preview Consulting Portal
              </Link>
            </div>
          ) : (
            <div className="consult-leads-grid">
              {consultations.map((c) => {
                const cleanPhone = (c.client_phone || '').replace(/[^0-9]/g, '');
                return (
                  <div key={c.booking_ref || c.id} className="consult-lead-card">
                    <div className="lead-card-head">
                      <div>
                        <span className="lead-badge">{c.tier_title}</span>
                        <h3 className="lead-client-name">{c.client_name}</h3>
                        <span className="lead-ref-code">{c.booking_ref}</span>
                      </div>
                      <div className="lead-fee-badge">
                        Rs {Number(c.tier_price || 2999).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="lead-details-list">
                      <div className="lead-detail-row">
                        <span className="detail-k">Phone / WhatsApp:</span>
                        <a
                          href={`https://wa.me/91${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="detail-v highlight-wa"
                        >
                          {c.client_phone} (Open WhatsApp Chat)
                        </a>
                      </div>
                      <div className="lead-detail-row">
                        <span className="detail-k">Email:</span>
                        <a href={`mailto:${c.client_email}`} className="detail-v">
                          {c.client_email}
                        </a>
                      </div>
                      {c.budget_range && (
                        <div className="lead-detail-row">
                          <span className="detail-k">Budget Range:</span>
                          <span className="detail-v">{c.budget_range}</span>
                        </div>
                      )}
                      {c.target_vehicle && (
                        <div className="lead-detail-row">
                          <span className="detail-k">Vehicle / Dilemma:</span>
                          <span className="detail-v">{c.target_vehicle}</span>
                        </div>
                      )}
                      {c.notes && (
                        <div className="lead-detail-row">
                          <span className="detail-k">Client Notes:</span>
                          <span className="detail-v" style={{ fontStyle: 'italic' }}>"{c.notes}"</span>
                        </div>
                      )}
                    </div>

                    <div className="lead-card-actions">
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(c.client_name)},%20this%20is%20TorqueTrader%20regarding%20your%20${encodeURIComponent(c.tier_title)}%20consultation%20booking.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        Message Client on WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : loading ? (
          <div className="dash-listings-grid">
            {Array(4).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty-box">
            <h3>No Listings Found in This View</h3>
            <p>Publish a verified superbike listing using our instant RC decoder.</p>
            <Link to="/dashboard/new" className="btn btn-primary" style={{ marginTop: 14 }}>
              Create Listing Now
            </Link>
          </div>
        ) : (
          <div className="dash-listings-grid">
            {filtered.map((l) => {
              const owned = isListingOwner(l);
              return (
                <div key={l.id} className="dash-card-wrapper">
                  <ListingCard listing={l} showStatus />
                  {owned && (
                    <div className="dash-card-owner-bar">
                      <span className="dash-card-owner-tag">
                        {Icons.shield} Your Listing
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-outline dash-card-delete-btn"
                        onClick={() => setListingToDelete(l)}
                        title="Delete this listing"
                      >
                        {Icons.trash} Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {listingToDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setListingToDelete(null)}>
          <div className="modal-dialog delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--red)', display: 'flex' }}>{Icons.trash}</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Delete Listing</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleting && setListingToDelete(null)}
                disabled={deleting}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Are you sure you want to permanently delete <strong>{listingToDelete.year} {listingToDelete.make} {listingToDelete.model}</strong>?
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
                onClick={() => setListingToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteListing(listingToDelete.id);
                    setListings((prev) => prev.filter((item) => String(item.id) !== String(listingToDelete.id)));
                    toast.success('Listing permanently deleted.');
                    setListingToDelete(null);
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Failed to delete listing.');
                  } finally {
                    setDeleting(false);
                  }
                }}
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
