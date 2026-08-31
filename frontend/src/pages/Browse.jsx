import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getListings } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import './Browse.css';

const ENGINES = ['Inline-4', 'V-Twin', 'Triple', 'Boxer', 'Other'];
const BODY_TYPES = ['Supersport', 'Naked', 'ADV', 'Cruiser', 'Modern Classic'];
const STATES = [
  { code: 'MH', label: 'Maharashtra (MH)' },
  { code: 'DL', label: 'Delhi NCR (DL)' },
  { code: 'KA', label: 'Karnataka (KA)' },
  { code: 'TN', label: 'Tamil Nadu (TN)' },
  { code: 'HR', label: 'Haryana (HR)' },
  { code: 'TS', label: 'Telangana (TS)' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // Filter States
  const [make, setMake] = useState(searchParams.get('make') || '');
  const [engine, setEngine] = useState(searchParams.get('engine_config') || '');
  const [bodyType, setBodyType] = useState(searchParams.get('body_type') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [ccCategory, setCcCategory] = useState(searchParams.get('cc') || '');
  const [singleOwnerOnly, setSingleOwnerOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sortBy, setSortBy] = useState('score_desc');

  useEffect(() => {
    setLoading(true);
    getListings()
      .then(({ data }) => {
        let res = [...data];

        if (make) {
          res = res.filter((l) => l.make.toLowerCase() === make.toLowerCase());
        }
        if (engine) {
          res = res.filter((l) => l.engine_config === engine);
        }
        if (bodyType) {
          res = res.filter((l) => l.body_type === bodyType);
        }
        if (selectedState) {
          res = res.filter((l) => (l.rto_state || '').includes(selectedState) || (l.location || '').includes(selectedState));
        }
        if (singleOwnerOnly) {
          res = res.filter((l) => l.ownership_count === 1);
        }
        if (minPrice) {
          res = res.filter((l) => Number(l.price) >= Number(minPrice));
        }
        if (maxPrice) {
          res = res.filter((l) => Number(l.price) <= Number(maxPrice));
        }
        if (ccCategory === 'under800') {
          res = res.filter((l) => (l.displacement_cc || 0) < 800);
        } else if (ccCategory === '800to1000') {
          res = res.filter((l) => (l.displacement_cc || 0) >= 800 && (l.displacement_cc || 0) <= 1000);
        } else if (ccCategory === 'litrePlus') {
          res = res.filter((l) => (l.displacement_cc || 0) > 1000);
        }

        // Sorting
        if (sortBy === 'price_asc') {
          res.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortBy === 'price_desc') {
          res.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (sortBy === 'odo_asc') {
          res.sort((a, b) => Number(a.odometer) - Number(b.odometer));
        } else if (sortBy === 'year_desc') {
          res.sort((a, b) => Number(b.year) - Number(a.year));
        } else {
          // Default: highest transparency score
          res.sort((a, b) => (b.transparency_score || 0) - (a.transparency_score || 0));
        }

        setListings(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [make, engine, bodyType, selectedState, singleOwnerOnly, minPrice, maxPrice, ccCategory, sortBy]);

  const clearFilters = () => {
    setMake('');
    setEngine('');
    setBodyType('');
    setSelectedState('');
    setCcCategory('');
    setSingleOwnerOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(make || engine || bodyType || selectedState || ccCategory || singleOwnerOnly || minPrice || maxPrice);

  return (
    <div className="browse-root">
      {/* Top Title Bar */}
      <div className="browse-title-bar">
        <div className="container browse-title-inner">
          <div>
            <span className="browse-eyebrow">INVENTORY SEARCH</span>
            <h1 className="browse-main-title">Superbike Catalogue</h1>
            <p className="browse-subtext">
              Showing {loading ? '...' : `${listings.length} verified listings`} across India
            </p>
          </div>

          <div className="browse-view-controls">
            <select
              className="browse-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="score_desc">Highest Transparency Score</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="odo_asc">Lowest Mileage First</option>
              <option value="year_desc">Newest Model Year</option>
            </select>

            <div className="view-toggle-btns">
              <button
                type="button"
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
              >
                {Icons.grid}
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List View"
              >
                {Icons.list}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Browse Layout */}
      <div className="container browse-body-grid">
        {/* Left Filter Sidebar */}
        <aside className="browse-filter-sidebar">
          <div className="filter-sidebar-header">
            <span className="filter-heading">{Icons.filter} Filter Parameters</span>
            {hasActiveFilters && (
              <button type="button" className="filter-clear-link" onClick={clearFilters}>
                Reset
              </button>
            )}
          </div>

          {/* Displacement CC Pills */}
          <div className="filter-group-box">
            <label className="filter-group-label">Displacement Class</label>
            <div className="filter-pill-stack">
              <button
                type="button"
                className={`filter-pill-option ${ccCategory === '' ? 'active' : ''}`}
                onClick={() => setCcCategory('')}
              >
                All Engine Classes
              </button>
              <button
                type="button"
                className={`filter-pill-option ${ccCategory === 'litrePlus' ? 'active' : ''}`}
                onClick={() => setCcCategory('litrePlus')}
              >
                1000cc+ Litre Class
              </button>
              <button
                type="button"
                className={`filter-pill-option ${ccCategory === '800to1000' ? 'active' : ''}`}
                onClick={() => setCcCategory('800to1000')}
              >
                800cc - 1000cc
              </button>
              <button
                type="button"
                className={`filter-pill-option ${ccCategory === 'under800' ? 'active' : ''}`}
                onClick={() => setCcCategory('under800')}
              >
                Under 800cc Middleweights
              </button>
            </div>
          </div>

          {/* Engine Layout */}
          <div className="filter-group-box">
            <label className="filter-group-label">Engine Cylinder Layout</label>
            <select
              className="filter-select"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
            >
              <option value="">All Configurations</option>
              {ENGINES.map((eng) => (
                <option key={eng} value={eng}>{eng}</option>
              ))}
            </select>
          </div>

          {/* Body Style */}
          <div className="filter-group-box">
            <label className="filter-group-label">Body Style</label>
            <select
              className="filter-select"
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
            >
              <option value="">All Body Styles</option>
              {BODY_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>

          {/* State / RTO Jurisdiction */}
          <div className="filter-group-box">
            <label className="filter-group-label">RTO Registration State</label>
            <select
              className="filter-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">All Indian States</option>
              {STATES.map((st) => (
                <option key={st.code} value={st.code}>{st.label}</option>
              ))}
            </select>
          </div>

          {/* Single Owner Checkbox */}
          <div className="filter-group-box">
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                className="filter-checkbox"
                checked={singleOwnerOnly}
                onChange={(e) => setSingleOwnerOnly(e.target.checked)}
              />
              <span>Single Owner Only (1st Owner)</span>
            </label>
          </div>

          {/* Price Range */}
          <div className="filter-group-box">
            <label className="filter-group-label">Asking Price Range (Rs)</label>
            <div className="price-inputs-row">
              <input
                type="number"
                className="price-sub-input"
                placeholder="Min Rs"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="price-sep">to</span>
              <input
                type="number"
                className="price-sub-input"
                placeholder="Max Rs"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Right Listings Results */}
        <main className="browse-results-col">
          {loading ? (
            <div className={`browse-listings-wrap ${viewMode}`}>
              {Array(6).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="browse-empty-state">
              <div className="empty-icon-slot">{Icons.search}</div>
              <h3 className="empty-title">No Superbikes Match Your Criteria</h3>
              <p className="empty-desc">
                Try widening your price range, selecting all engine classes, or clearing active filters.
              </p>
              <button type="button" className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: 16 }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={`browse-listings-wrap ${viewMode}`}>
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
