import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getListings } from '../api';
import ListingCard from '../components/ListingCard';
import './Browse.css';

const ENGINE_OPTIONS = ['Inline-4','V-Twin','L-Twin','Triple','Boxer','Other'];
const BODY_OPTIONS   = ['Supersport','Naked','ADV','Cruiser','Modern Classic'];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);

  const [filters, setFilters] = useState({
    location:      searchParams.get('location') || '',
    min_price:     searchParams.get('min_price') || '',
    max_price:     searchParams.get('max_price') || '',
    engine_config: searchParams.get('engine_config') || '',
    min_bhp:       searchParams.get('min_bhp') || '',
    skip:          0,
    limit:         12,
  });

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
    );
    getListings(params)
      .then(({ data }) => { setListings(data); setTotal(data.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const setFilter = (key, value) =>
    setFilters(f => ({ ...f, [key]: value, skip: 0 }));

  const clearFilters = () =>
    setFilters({ location:'', min_price:'', max_price:'', engine_config:'', min_bhp:'', skip:0, limit:12 });

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="container">
          <h1 className="page-title">Browse Superbikes</h1>
          <p className="page-subtitle">{loading ? 'Loading…' : `${listings.length} bikes found`}</p>
        </div>
      </div>

      <div className="container browse-layout">
        {/* Sidebar filters */}
        <aside className="filter-sidebar">
          <div className="filter-header">
            <span className="filter-title">Filters</span>
            <button className="filter-clear" onClick={clearFilters}>Clear all</button>
          </div>

          <div className="filter-group">
            <label className="filter-label">Location</label>
            <input id="filter-location" className="input" placeholder="e.g. Mumbai"
              value={filters.location} onChange={e => setFilter('location', e.target.value)} />
          </div>

          <div className="filter-group">
            <label className="filter-label">Price Range (₹)</label>
            <div className="range-inputs">
              <input id="filter-min-price" className="input" type="number" placeholder="Min"
                value={filters.min_price} onChange={e => setFilter('min_price', e.target.value)} />
              <input id="filter-max-price" className="input" type="number" placeholder="Max"
                value={filters.max_price} onChange={e => setFilter('max_price', e.target.value)} />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Engine</label>
            <select id="filter-engine" className="input" value={filters.engine_config}
              onChange={e => setFilter('engine_config', e.target.value)}>
              <option value="">All engines</option>
              {ENGINE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Min BHP</label>
            <input id="filter-min-bhp" className="input" type="number" placeholder="e.g. 150"
              value={filters.min_bhp} onChange={e => setFilter('min_bhp', e.target.value)} />
          </div>

          <div className="filter-group">
            <label className="filter-label">Body Type</label>
            <div className="body-pills">
              {BODY_OPTIONS.map(b => (
                <button key={b}
                  className={`body-pill ${filters.body_type === b ? 'active' : ''}`}
                  onClick={() => setFilter('body_type', filters.body_type === b ? '' : b)}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Listings */}
        <main className="browse-main">
          {loading ? (
            <div className="spinner" />
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No bikes found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="listings-grid">
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
              {listings.length === filters.limit && (
                <div className="pagination">
                  <button className="btn btn-ghost"
                    disabled={filters.skip === 0}
                    onClick={() => setFilters(f => ({ ...f, skip: Math.max(0, f.skip - f.limit) }))}>
                    ← Previous
                  </button>
                  <button className="btn btn-ghost"
                    onClick={() => setFilters(f => ({ ...f, skip: f.skip + f.limit }))}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
