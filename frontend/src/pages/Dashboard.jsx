import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getListings } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import './Dashboard.css';

const STATUS_COUNTS = (listings) => ({
  total:   listings.length,
  active:  listings.filter(l => l.status === 'active').length,
  pending: listings.filter(l => l.status === 'pending_verification').length,
  draft:   listings.filter(l => l.status === 'draft').length,
  sold:    listings.filter(l => l.status === 'sold').length,
});

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    getListings({ limit: 100 })
      .then(({ data }) => setListings(data.filter(l => l.seller_id === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div style={{ paddingTop: 120, textAlign:'center' }}><div className="skeleton" style={{ height: 400, maxWidth: 600, margin: '0 auto' }} /></div>;
  if (!user) return <Navigate to="/" replace />;

  const counts = STATUS_COUNTS(listings);

  const filtered = activeTab === 'all'
    ? listings
    : listings.filter(l => l.status === activeTab || (activeTab === 'pending' && l.status === 'pending_verification'));

  const TABS = [
    { id: 'all',     label: 'All',     count: counts.total   },
    { id: 'active',  label: 'Active',  count: counts.active  },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'draft',   label: 'Drafts',  count: counts.draft   },
    { id: 'sold',    label: 'Sold',    count: counts.sold    },
  ];

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div className="container dash-header-inner">
          <div>
            <h1 className="page-title">My Dashboard</h1>
            <p className="page-sub">
              {user.email} &nbsp;·&nbsp;
              <span className="dash-role">{user.role?.replace(/_/g, ' ')}</span>
            </p>
          </div>
          <Link to="/dashboard/new" id="new-listing-btn" className="btn btn-primary">
            {Icons.plus} New Listing
          </Link>
        </div>
      </div>

      <div className="container dash-body">
        {/* Stats */}
        <div className="dash-stats">
          {[
            { label: 'Total Listings', val: counts.total,   color: 'neutral' },
            { label: 'Active',         val: counts.active,  color: 'green'   },
            { label: 'Pending Review', val: counts.pending, color: 'amber'   },
            { label: 'Sold',           val: counts.sold,    color: 'red'     },
          ].map(s => (
            <div key={s.label} className={`stat-card card stat-${s.color}`}>
              <div className="stat-val">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`dash-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.count > 0 && <span className="tab-count">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="dash-grid">
            {Array(4).fill(0).map((_,i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {Icons.bike}
            <h3>{activeTab === 'all' ? 'No listings yet' : `No ${activeTab} listings`}</h3>
            <p>{activeTab === 'all' ? 'Create your first listing to start selling' : 'Switch tabs to see other listings'}</p>
            {activeTab === 'all' && (
              <Link to="/dashboard/new" className="btn btn-primary" style={{ marginTop: 16 }}>
                {Icons.plus} Create Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="dash-grid">
            {filtered.map(l => <ListingCard key={l.id} listing={l} showStatus />)}
          </div>
        )}
      </div>
    </div>
  );
}
