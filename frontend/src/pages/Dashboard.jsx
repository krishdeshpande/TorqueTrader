import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getListings } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    getListings()
      .then(({ data }) => {
        // Show user's listings + custom mock items
        setListings(data);
      })
      .catch(() => {})
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

  const counts = {
    total: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    leads: 18,
    verified: listings.filter((l) => (l.transparency_score || 0) >= 90).length,
  };

  const filtered = activeTab === 'all'
    ? listings
    : listings.filter((l) => l.status === activeTab);

  return (
    <div className="dash-root">
      {/* Top Banner */}
      <div className="dash-top-bar">
        <div className="container dash-top-inner">
          <div>
            <span className="dash-eyebrow">SELLER CONSOLE</span>
            <h1 className="dash-main-title">Seller Management Dashboard</h1>
            <p className="dash-subtext">
              Authenticated as <span className="dash-email-tag">{user.email}</span> · Verified Superbike Seller
            </p>
          </div>

          <Link to="/dashboard/new" className="btn btn-primary">
            {Icons.plus} List a Superbike (RC Autofill)
          </Link>
        </div>
      </div>

      <div className="container dash-content-layout">
        {/* Stats Row */}
        <div className="dash-stats-row">
          <div className="dash-stat-card">
            <span className="stat-label">Active Listings</span>
            <div className="stat-val">{counts.total}</div>
            <span className="stat-sub">Live on Indian Marketplace</span>
          </div>

          <div className="dash-stat-card">
            <span className="stat-label">Buyer Leads & Inquiries</span>
            <div className="stat-val">{counts.leads}</div>
            <span className="stat-sub">Direct WhatsApp / Phone Inquiries</span>
          </div>

          <div className="dash-stat-card">
            <span className="stat-label">mParivahan Verified</span>
            <div className="stat-val">{counts.verified}</div>
            <span className="stat-sub">90+ Transparency Score</span>
          </div>

          <div className="dash-stat-card">
            <span className="stat-label">Market Status</span>
            <div className="stat-val" style={{ color: 'var(--green-dark)' }}>Active</div>
            <span className="stat-sub">Direct Buyer Settlement</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dash-tabs-bar">
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

        {/* Listings View */}
        {loading ? (
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
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} showStatus />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
