import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getListings } from '../api';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';
import { Icons } from '../components/Icons';
import './Browse.css';

const ENGINES   = ['Inline-4','V-Twin','L-Twin','Triple','Boxer','Other'];
const BODYTYPES = ['Supersport','Naked','ADV','Cruiser','Modern Classic'];
const SORTS     = [
  { val: '',        label: 'Relevance' },
  { val: 'price_asc',  label: 'Price: Low to High' },
  { val: 'price_desc', label: 'Price: High to Low' },
  { val: 'score',      label: 'Highest Score' },
];

export default function Browse() {
  const [sp, setSp] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [f, setF] = useState({
    location:      sp.get('location')      || '',
    min_price:     sp.get('min_price')     || '',
    max_price:     sp.get('max_price')     || '',
    engine_config: sp.get('engine_config') || '',
    min_bhp:       sp.get('min_bhp')       || '',
    body_type:     sp.get('body_type')     || '',
    skip:  0,
    limit: 12,
  });
  const [sortBy, setSortBy] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const setField = (key, val) => setF(prev => ({ ...prev, [key]: val, skip: 0 }));
  const clearAll = () => setF({ location:'', min_price:'', max_price:'', engine_config:'', min_bhp:'', body_type:'', skip:0, limit:12 });

  const activeFilters = Object.entries(f)
    .filter(([k, v]) => v !== '' && !['skip','limit'].includes(k))
    .map(([k, v]) => ({ key: k, val: v, label: `${k.replace(/_/g,' ')}: ${v}` }));

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(f).filter(([,v]) => v !== ''));
    getListings(params)
      .then(({ data }) => {
        let sorted = [...data];
        if (sortBy === 'price_asc')  sorted.sort((a,b) => a.price - b.price);
        if (sortBy === 'price_desc') sorted.sort((a,b) => b.price - a.price);
        if (sortBy === 'score')      sorted.sort((a,b) => b.transparency_score - a.transparency_score);
        setListings(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [f, sortBy]);

  const Filters = () => (
    <div className="filter-fields">
      <input id="filter-location" className="input filter-input" placeholder="City or state" value={f.location} onChange={e => setField('location', e.target.value)} />
      <input id="filter-min-price" className="input filter-input" type="number" placeholder="Min price (₹)" value={f.min_price} onChange={e => setField('min_price', e.target.value)} />
      <input id="filter-max-price" className="input filter-input" type="number" placeholder="Max price (₹)" value={f.max_price} onChange={e => setField('max_price', e.target.value)} />
      <select id="filter-engine" className="input filter-input" value={f.engine_config} onChange={e => setField('engine_config', e.target.value)}>
        <option value="">All engines</option>
        {ENGINES.map(e => <option key={e}>{e}</option>)}
      </select>
      <select id="filter-body" className="input filter-input" value={f.body_type} onChange={e => setField('body_type', e.target.value)}>
        <option value="">All body types</option>
        {BODYTYPES.map(b => <option key={b}>{b}</option>)}
      </select>
      <input id="filter-min-bhp" className="input filter-input" type="number" placeholder="Min BHP" value={f.min_bhp} onChange={e => setField('min_bhp', e.target.value)} />
    </div>
  );

  return (
    <div className="browse-page">
      {/* Page header */}
      <div className="browse-header">
        <div className="container browse-header-inner">
          <div>
            <h1 className="page-title">Browse Superbikes</h1>
            <p className="page-sub">{loading ? 'Searching…' : `${listings.length} bikes found`}</p>
          </div>
          <button className="btn btn-ghost btn-sm mobile-filter-btn" onClick={() => setShowMobileFilters(!showMobileFilters)}>
            {Icons.filter} Filters {activeFilters.length > 0 && <span className="filter-count">{activeFilters.length}</span>}
          </button>
        </div>
      </div>

      {/* Desktop filter bar */}
      <div className="filter-bar">
        <div className="container filter-bar-inner">
          <Filters />
          <select className="input filter-input sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {SORTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>
          {activeFilters.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear all</button>
          )}
        </div>
      </div>

      {/* Mobile filter panel */}
      {showMobileFilters && (
        <div className="mobile-filter-panel">
          <div className="container">
            <Filters />
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setShowMobileFilters(false)}>
                Apply Filters
              </button>
              <button className="btn btn-ghost" onClick={clearAll}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="active-filters container">
          {activeFilters.map(af => (
            <button key={af.key} className="active-pill" onClick={() => setField(af.key, '')}>
              {af.label} {Icons.x}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="container browse-results">
        {loading ? (
          <div className="listings-grid">
            {Array(12).fill(0).map((_,i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            {Icons.search}
            <h3>No bikes found</h3>
            <p>Try adjusting your filters or clearing them</p>
            <button className="btn btn-ghost" style={{ marginTop:16 }} onClick={clearAll}>Clear all filters</button>
          </div>
        ) : (
          <>
            <div className="listings-grid">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
            {listings.length === f.limit && (
              <div className="browse-pagination">
                <button className="btn btn-ghost" disabled={f.skip === 0}
                  onClick={() => setF(p => ({...p, skip: Math.max(0, p.skip - p.limit)}))}>
                  ← Previous
                </button>
                <span className="page-info">Page {Math.floor(f.skip/f.limit) + 1}</span>
                <button className="btn btn-ghost"
                  onClick={() => setF(p => ({...p, skip: p.skip + p.limit}))}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
