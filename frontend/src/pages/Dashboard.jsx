import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getListings } from '../api';
import ListingCard from '../components/ListingCard';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    getListings({ limit: 50 })
      .then(({ data }) => setListings(data.filter(l => l.seller_id === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="container dash-header-inner">
          <div>
            <h1 className="page-title">My Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user.email?.split('@')[0]}
              &nbsp;·&nbsp;
              <span className="role-badge">{user.role?.replace('_', ' ')}</span>
            </p>
          </div>
          <Link to="/dashboard/new" id="new-listing-btn" className="btn btn-primary">
            + New Listing
          </Link>
        </div>
      </div>

      <div className="container dashboard-body">
        {/* Stats */}
        <div className="dash-stats">
          {[
            { label: 'Total Listings', value: listings.length },
            { label: 'Active',  value: listings.filter(l => l.status === 'active').length },
            { label: 'Pending', value: listings.filter(l => l.status === 'pending_verification').length },
            { label: 'Draft',   value: listings.filter(l => l.status === 'draft').length },
          ].map(s => (
            <div className="dash-stat card" key={s.label}>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="dash-section-title">Your Listings</h2>

        {loading ? (
          <div className="spinner" />
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏍️</div>
            <h3>No listings yet</h3>
            <p>Create your first listing to start selling</p>
            <Link to="/dashboard/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              + Create Listing
            </Link>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} showStatus />)}
          </div>
        )}
      </div>
    </div>
  );
}
