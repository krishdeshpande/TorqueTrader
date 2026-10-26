import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import {
  getGroupBuyingCatalog,
  getBuyerGroups,
  getGroupDetail,
  createBuyerGroup,
  joinBuyerGroup,
  leaveBuyerGroup,
  submitBuyerOfferDecision,
  getDealerEligibleGroups,
  submitDealerQuote,
  getAdminGroupMetrics,
  adminRequestQuotes,
  adminReleaseOffers,
} from '../api';
import './GroupBuying.css';

export default function GroupBuying() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Primary navigation tab
  const [activeTab, setActiveTab] = useState('car_pools'); // 'car_pools' | 'insurance_pools' | 'dealer_portal' | 'admin_console'

  // Demo Role Switcher state
  const [demoRole, setDemoRole] = useState('buyer'); // 'buyer' | 'dealer' | 'admin'

  // Data states
  const [groups, setGroups] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [targetQuote, setTargetQuote] = useState(null);

  // Forms
  const [joinForm, setJoinForm] = useState({
    buyer_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Aarav Shah',
    buyer_email: user?.email || 'aarav.mumbai@demo.tt',
    buyer_phone: '+91 98201 10001',
    selected_color: 'Atlas White',
    pool_group_insurance: true,
    purchase_timeline: 'Within 30 Days',
    purchase_readiness: 'ready_to_buy',
    current_ncb: '50%',
    custom_addons: ['Zero Depreciation', 'Return to Invoice', 'Engine & Gearbox Protection'],
  });

  const [createForm, setCreateForm] = useState({
    group_type: 'car_purchase',
    title: '',
    city: 'Mumbai',
    target_make: 'Hyundai',
    target_model: 'Creta',
    target_variant: 'SX(O) Petrol IVT (Automatic)',
    fuel_type: 'Petrol',
    transmission: 'Automatic (IVT)',
    target_insurer: 'Multi-Insurer Bidding',
    target_members: 20,
    target_purchase_timeline: 'Within 30 Days',
    notes: '',
  });

  const [decisionForm, setDecisionForm] = useState({
    decision: 'callback_requested',
    preferred_contact_method: 'whatsapp',
    notes: 'Interested in financing options and immediate weekend test drive at showroom.',
  });

  // Dealer quotation form
  const [quoteForm, setQuoteForm] = useState({
    dealer_id: 1, // Default Apex Hyundai demo
    ex_showroom_price: 1870000,
    rto_road_tax: 224400,
    insurance_rate_standard: 78000,
    insurance_rate_group: 43000,
    mandatory_charges: 3500,
    standard_accessories: 12000,
    group_cash_discount: 250000,
    corporate_exchange_bonus: 25000,
    additional_perks: 'Free 4-Year Extended Warranty, Free Ceramic Coating Voucher, Priority Batch Delivery',
    validity_date: 'Valid for 15 Days',
    delivery_timeline_weeks: 2,
    booking_amount: 25000,
    conditions: 'Applies to 20 firm bookings placed before quote deadline.',
  });

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, catalogRes, metricsRes] = await Promise.all([
        getBuyerGroups(),
        getGroupBuyingCatalog(),
        getAdminGroupMetrics().catch(() => ({ data: null })),
      ]);

      setGroups(groupsRes.data || []);
      setCatalog(catalogRes.data || []);
      if (metricsRes?.data) setMetrics(metricsRes.data);

      // Auto-select Mumbai Creta group by default if available
      const cretaGroup = (groupsRes.data || []).find((g) => g.title.includes('Creta')) || (groupsRes.data || [])[0];
      if (cretaGroup) {
        const detailRes = await getGroupDetail(cretaGroup.id);
        setSelectedGroup(detailRes.data);
      }
    } catch (err) {
      console.error('Error fetching group buying data:', err);
      toast.error('Could not load group buying pools. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL query parameters from Advisor CTA (e.g. /group-buying?make=Hyundai&model=Creta&city=Mumbai)
  useEffect(() => {
    const makeParam = searchParams.get('make');
    const modelParam = searchParams.get('model');
    const cityParam = searchParams.get('city');

    if (makeParam || modelParam) {
      setCreateForm((prev) => ({
        ...prev,
        target_make: makeParam || prev.target_make,
        target_model: modelParam || prev.target_model,
        city: cityParam || prev.city,
        title: `${cityParam || 'Mumbai'} ${makeParam || ''} ${modelParam || ''} Collective Buyer Group`.trim(),
      }));
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Select a group for full side-by-side view
  const handleSelectGroup = async (groupId) => {
    try {
      const res = await getGroupDetail(groupId);
      setSelectedGroup(res.data);
      // scroll to detail container
      const el = document.getElementById('group-detail-view');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      toast.error('Failed to load group details.');
    }
  };

  // Submit Join Request
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const res = await joinBuyerGroup(selectedGroup.id, joinForm);
      toast.success(res.data.message || 'Successfully joined group!');
      setShowJoinModal(false);
      handleSelectGroup(selectedGroup.id);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to join group.';
      toast.error(msg);
    }
  };

  // Submit Create Group
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createBuyerGroup(createForm);
      toast.success('Buyer group created! Invite fellow buyers to pool demand.');
      setShowCreateModal(false);
      await fetchData();
      handleSelectGroup(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create group.');
    }
  };

  // Submit Offer Decision (Request Callback / Book)
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !targetQuote) return;

    try {
      const payload = {
        group_id: selectedGroup.id,
        quotation_id: targetQuote.id,
        buyer_name: joinForm.buyer_name,
        buyer_email: joinForm.buyer_email,
        buyer_phone: joinForm.buyer_phone,
        decision: decisionForm.decision,
        preferred_contact_method: decisionForm.preferred_contact_method,
        notes: decisionForm.notes,
      };

      const res = await submitBuyerOfferDecision(payload);
      toast.success(res.data.message || 'Dealership callback request routed!');
      setShowDecisionModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record decision.');
    }
  };

  // Dealer Submit Quote
  const handleDealerQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const perksArray = quoteForm.additional_perks
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        group_id: selectedGroup.id,
        ex_showroom_price: Number(quoteForm.ex_showroom_price),
        rto_road_tax: Number(quoteForm.rto_road_tax),
        insurance_rate_standard: Number(quoteForm.insurance_rate_standard),
        insurance_rate_group: Number(quoteForm.insurance_rate_group),
        mandatory_charges: Number(quoteForm.mandatory_charges),
        standard_accessories: Number(quoteForm.standard_accessories),
        group_cash_discount: Number(quoteForm.group_cash_discount),
        corporate_exchange_bonus: Number(quoteForm.corporate_exchange_bonus),
        additional_perks: perksArray,
        validity_date: quoteForm.validity_date,
        delivery_timeline_weeks: Number(quoteForm.delivery_timeline_weeks),
        booking_amount: Number(quoteForm.booking_amount),
        conditions: quoteForm.conditions,
      };

      const res = await submitDealerQuote(quoteForm.dealer_id, payload);
      toast.success(res.data.message || 'Sealed quote submitted!');
      handleSelectGroup(selectedGroup.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit quote.');
    }
  };

  // Admin Actions
  const handleAdminRequestQuotes = async () => {
    if (!selectedGroup) return;
    try {
      await adminRequestQuotes(selectedGroup.id);
      toast.success('Quotation request published to authorized dealerships!');
      handleSelectGroup(selectedGroup.id);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish request.');
    }
  };

  const handleAdminReleaseOffers = async () => {
    if (!selectedGroup) return;
    try {
      const res = await adminReleaseOffers(selectedGroup.id);
      toast.success(res.data.message || 'Offers unsealed for buyers!');
      handleSelectGroup(selectedGroup.id);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to release offers.');
    }
  };

  // Filter groups by active tab
  const displayedGroups = groups.filter((g) => {
    if (activeTab === 'insurance_pools') return g.group_type === 'insurance_renewal';
    return g.group_type === 'car_purchase';
  });

  return (
    <div className="gb-root">
      {/* ── Demo Switcher Banner ────────────────────────────────────────── */}
      <div className="gb-demo-bar">
        <div className="container gb-demo-inner">
          <div className="gb-demo-label">
            <span className="gb-pulse-dot" />
            <strong>MVP DEMO ROLE SWITCHER:</strong> Experience the complete group buying ecosystem
          </div>
          <div className="gb-role-buttons">
            <button
              type="button"
              className={`gb-role-pill ${demoRole === 'buyer' ? 'active' : ''}`}
              onClick={() => {
                setDemoRole('buyer');
                setActiveTab('car_pools');
                toast.info('Switched to Buyer View (Mumbai Pooled Buyer)');
              }}
            >
              👤 Buyer View
            </button>
            <button
              type="button"
              className={`gb-role-pill ${demoRole === 'dealer' ? 'active' : ''}`}
              onClick={() => {
                setDemoRole('dealer');
                setActiveTab('dealer_portal');
                toast.info('Switched to Dealer View (Apex Hyundai Mumbai)');
              }}
            >
              🏢 Dealership Sales Desk
            </button>
            <button
              type="button"
              className={`gb-role-pill ${demoRole === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setDemoRole('admin');
                setActiveTab('admin_console');
                toast.info('Switched to Admin View (Platform Controller)');
              }}
            >
              🛡️ Platform Admin
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="gb-hero">
        <div className="container gb-hero-inner">
          <div className="gb-hero-badge">
            <span className="gb-tag-icon">⚡</span> COLLECTIVE BARGAINING POWER FOR INDIAN MOTORISTS
          </div>
          <h1 className="gb-hero-title">
            Stop Negotiating Alone. <br />
            <span className="gb-gradient-text">Make Dealerships & Insurers Compete.</span>
          </h1>
          <p className="gb-hero-subtitle">
            Pool purchasing demand with verified buyers in your city. Dealerships and insurance companies submit
            sealed competitive on-road bids. Compare transparent price breakdowns and save up to ₹3,15,000 per car.
          </p>

          {/* Quick Metrics Ticker */}
          <div className="gb-hero-stats">
            <div className="gb-stat-box">
              <span className="gb-stat-val">₹74.6L+</span>
              <span className="gb-stat-lbl">Community Savings</span>
            </div>
            <div className="gb-stat-box">
              <span className="gb-stat-val">20 Buyers</span>
              <span className="gb-stat-lbl">Pooled in Mumbai</span>
            </div>
            <div className="gb-stat-box">
              <span className="gb-stat-val">3 Sealed Bids</span>
              <span className="gb-stat-lbl">Competing Hyundai Dealers</span>
            </div>
            <div className="gb-stat-box">
              <span className="gb-stat-val">50% Off</span>
              <span className="gb-stat-lbl">Motor Insurance via Pool</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ─────────────────────────────────────────────── */}
      <section className="container gb-tabs-section">
        <div className="gb-tab-nav">
          <button
            type="button"
            className={`gb-tab-item ${activeTab === 'car_pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('car_pools')}
          >
            🚗 Car Purchase Pools ({groups.filter((g) => g.group_type === 'car_purchase').length})
          </button>
          <button
            type="button"
            className={`gb-tab-item ${activeTab === 'insurance_pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('insurance_pools')}
          >
            🛡️ Group Motor Insurance Pools ({groups.filter((g) => g.group_type === 'insurance_renewal').length})
          </button>
          <button
            type="button"
            className={`gb-tab-item ${activeTab === 'dealer_portal' ? 'active' : ''}`}
            onClick={() => setActiveTab('dealer_portal')}
          >
            🏢 Dealership Bidding Portal
          </button>
          <button
            type="button"
            className={`gb-tab-item ${activeTab === 'admin_console' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin_console')}
          >
            ⚙️ Platform Admin & Analytics
          </button>
        </div>

        {/* ── Tab 1: Car Pools & Tab 2: Insurance Pools ──────────────────── */}
        {(activeTab === 'car_pools' || activeTab === 'insurance_pools') && (
          <div className="gb-pool-layout">
            <div className="gb-pool-header-actions">
              <div>
                <h2 className="gb-section-title">
                  {activeTab === 'car_pools'
                    ? 'Active Car Buyer Groups in India'
                    : 'Group Motor Insurance Renewal Pools'}
                </h2>
                <p className="gb-section-desc">
                  {activeTab === 'car_pools'
                    ? 'Join a high-volume group in your city to unlock direct fleet-level dealer discounts.'
                    : 'Pool your annual car or superbike insurance renewal with other owners to get wholesale fleet rates from HDFC ERGO, Tata AIG, and ICICI Lombard.'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCreateForm((prev) => ({
                    ...prev,
                    group_type: activeTab === 'insurance_pools' ? 'insurance_renewal' : 'car_purchase',
                    title: activeTab === 'insurance_pools' ? 'Mumbai Annual Insurance Renewal Pool' : '',
                  }));
                  setShowCreateModal(true);
                }}
              >
                + Start a New Buyer Pool
              </button>
            </div>

            {/* Pool Cards Grid */}
            <div className="gb-cards-grid">
              {displayedGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                const progressPct = Math.min(100, Math.round((group.member_count / group.target_members) * 100));

                return (
                  <div
                    key={group.id}
                    className={`gb-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectGroup(group.id)}
                  >
                    <div className="gb-card-top">
                      <span className="gb-city-pill">📍 {group.city}</span>
                      <span className={`gb-status-badge ${group.status}`}>
                        {group.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="gb-card-title">{group.title}</h3>

                    <div className="gb-card-meta">
                      <span>🎯 Target: {group.target_members} Buyers</span>
                      <span>👥 Joined: {group.member_count} Members</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="gb-progress-wrap">
                      <div className="gb-progress-bar" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="gb-progress-sub">
                      <span>{progressPct}% Capacity Reached</span>
                      {group.insurance_pooled_count > 0 && (
                        <span className="gb-ins-pooled-tag">
                          🛡️ {group.insurance_pooled_count} Insurance Pooled
                        </span>
                      )}
                    </div>

                    {group.best_quote_on_road && (
                      <div className="gb-savings-box">
                        <div className="gb-savings-lbl">Best Quoted On-Road:</div>
                        <div className="gb-best-price">₹{Number(group.best_quote_on_road).toLocaleString('en-IN')}</div>
                        <div className="gb-save-tag">
                          Save ₹{Number(group.max_savings_per_car).toLocaleString('en-IN')} vs. Individual Showroom!
                        </div>
                      </div>
                    )}

                    <div className="gb-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectGroup(group.id);
                        }}
                      >
                        {isSelected ? 'Viewing Side-by-Side Offers ↓' : 'View Group & Dealer Quotes →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Selected Group Side-by-Side Quotation Comparison ─────── */}
            {selectedGroup && (
              <div id="group-detail-view" className="gb-detail-panel">
                <div className="gb-detail-head">
                  <div>
                    <span className="gb-eyebrow">ACTIVE DEMAND DOSSIER</span>
                    <h2 className="gb-detail-title">{selectedGroup.title}</h2>
                    <p className="gb-detail-sub">
                      City: <strong>{selectedGroup.city}</strong> • Target: <strong>{selectedGroup.target_members} Buyers</strong> •
                      Active Members: <strong>{selectedGroup.member_count}</strong> • Insurance Pooled:{' '}
                      <strong>{selectedGroup.insurance_pooled_count}</strong>
                    </p>
                  </div>
                  <div className="gb-head-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowJoinModal(true)}
                    >
                      + Join This Buyer Pool
                    </button>
                  </div>
                </div>

                {/* Quotation Comparison Matrix */}
                <div className="gb-quotes-container">
                  <div className="gb-quotes-header">
                    <div>
                      <h3 className="gb-sub-title">Dealership Quotation Comparison Matrix</h3>
                      <p className="gb-sub-desc">
                        Participating dealerships compete independently with sealed price breakdowns.
                      </p>
                    </div>
                    {selectedGroup.quotations?.length > 0 && (
                      <span className="gb-verified-seal">
                        ✓ {selectedGroup.quotations.length} Competing Dealership Quotes Unsealed
                      </span>
                    )}
                  </div>

                  {(!selectedGroup.quotations || selectedGroup.quotations.length === 0) ? (
                    <div className="gb-empty-quotes">
                      <p>Dealership quotes are currently being collected under sealed bidding.</p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAdminReleaseOffers}
                      >
                        [Admin Demo] Unseal Submitted Quotes Now
                      </button>
                    </div>
                  ) : (
                    <div className="gb-table-responsive">
                      <table className="gb-compare-table">
                        <thead>
                          <tr>
                            <th>Price Breakdown Component</th>
                            {selectedGroup.quotations.map((q) => (
                              <th key={q.id} className={q.is_best_offer ? 'best-offer-col' : ''}>
                                {q.is_best_offer && <div className="best-tag">★ BEST VALUE</div>}
                                <div className="dealer-col-name">{q.dealer_name}</div>
                                <div className="dealer-col-type">
                                  {q.dealer_type === 'insurance_broker' ? 'Insurance Broker' : 'Authorized Dealership'}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGroup.group_type === 'car_purchase' && (
                            <>
                              <tr>
                                <td className="prop-name">Ex-Showroom Base Price</td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id}>₹{Number(q.ex_showroom_price).toLocaleString('en-IN')}</td>
                                ))}
                              </tr>
                              <tr>
                                <td className="prop-name">RTO / Road Tax (Mumbai Individual)</td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id}>₹{Number(q.rto_road_tax).toLocaleString('en-IN')}</td>
                                ))}
                              </tr>
                              <tr>
                                <td className="prop-name">
                                  Motor Insurance (Zero-Dep + RTI)
                                  <span className="prop-sub">Standard Retail vs Group Pooled</span>
                                </td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id}>
                                    <div className="ins-strike">₹{Number(q.insurance_rate_standard).toLocaleString('en-IN')}</div>
                                    <div className="ins-group-price">
                                      ₹{Number(q.insurance_rate_group).toLocaleString('en-IN')}{' '}
                                      <span className="ins-disc-pill">Group Rate</span>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="prop-name">Mandatory Fastag & Registration Logistics</td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id}>₹{Number(q.mandatory_charges).toLocaleString('en-IN')}</td>
                                ))}
                              </tr>
                              <tr>
                                <td className="prop-name">
                                  Group Cash Discount
                                  <span className="prop-sub">Wholesale Fleet Allowance</span>
                                </td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id} className="discount-cell">
                                    -₹{Number(q.group_cash_discount).toLocaleString('en-IN')}
                                  </td>
                                ))}
                              </tr>
                            </>
                          )}

                          {selectedGroup.group_type === 'insurance_renewal' && (
                            <>
                              <tr>
                                <td className="prop-name">Individual Retail OD + TP Premium</td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id} className="ins-strike">
                                    ₹{Number(q.insurance_rate_standard).toLocaleString('en-IN')}
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="prop-name">
                                  Bulk Pool Discount
                                  <span className="prop-sub">Corporate Agency Fleet Subsidy</span>
                                </td>
                                {selectedGroup.quotations.map((q) => (
                                  <td key={q.id} className="discount-cell">
                                    -₹{Number(q.total_group_discount).toLocaleString('en-IN')}
                                  </td>
                                ))}
                              </tr>
                            </>
                          )}

                          {/* Net Price Highlight Row */}
                          <tr className="highlight-row">
                            <td className="prop-name">
                              <strong>FINAL NET PRICE</strong>
                              <span className="prop-sub">
                                {selectedGroup.group_type === 'car_purchase' ? 'On-Road per Car' : 'Net Annual Premium'}
                              </span>
                            </td>
                            {selectedGroup.quotations.map((q) => (
                              <td key={q.id} className={q.is_best_offer ? 'best-net-price' : 'net-price'}>
                                ₹{Number(q.final_net_on_road).toLocaleString('en-IN')}
                              </td>
                            ))}
                          </tr>

                          {/* Savings Row */}
                          <tr className="savings-row">
                            <td className="prop-name">
                              <strong>TOTAL PER-MEMBER SAVINGS</strong>
                            </td>
                            {selectedGroup.quotations.map((q) => (
                              <td key={q.id} className="savings-cell">
                                Save ₹{Number(q.total_group_discount).toLocaleString('en-IN')}
                              </td>
                            ))}
                          </tr>

                          {/* Perks & Delivery */}
                          <tr>
                            <td className="prop-name">Exclusive Group Perks</td>
                            {selectedGroup.quotations.map((q) => (
                              <td key={q.id}>
                                <ul className="perks-list">
                                  {(q.additional_perks || []).map((p, idx) => (
                                    <li key={idx}>✓ {p}</li>
                                  ))}
                                </ul>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="prop-name">Vehicle Allocation Timeline</td>
                            {selectedGroup.quotations.map((q) => (
                              <td key={q.id}>
                                <strong>{q.delivery_timeline_weeks} Weeks</strong>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="prop-name">Booking Token per Member</td>
                            {selectedGroup.quotations.map((q) => (
                              <td key={q.id}>₹{Number(q.booking_amount).toLocaleString('en-IN')}</td>
                            ))}
                          </tr>

                          {/* CTA Row */}
                          <tr className="cta-row">
                            <td className="prop-name">Action</td>
                            {selectedGroup.quotations.map((q) => (
                              <td key={q.id}>
                                <button
                                  type="button"
                                  className={`btn ${q.is_best_offer ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                  style={{ width: '100%' }}
                                  onClick={() => {
                                    setTargetQuote(q);
                                    setShowDecisionModal(true);
                                  }}
                                >
                                  {q.is_best_offer ? 'Accept Best Offer & Request Callback' : 'Choose This Dealership'}
                                </button>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Member Roster */}
                <div className="gb-roster-box">
                  <h4 className="gb-roster-title">
                    Group Member Roster ({selectedGroup.members?.length || 0} Pooled Buyers)
                  </h4>
                  <div className="gb-roster-grid">
                    {(selectedGroup.members || []).map((m, idx) => (
                      <div key={m.id || idx} className="gb-roster-item">
                        <div className="roster-avatar">#{idx + 1}</div>
                        <div>
                          <div className="roster-name">{m.buyer_name}</div>
                          <div className="roster-meta">
                            {m.purchase_timeline} • {m.pool_group_insurance ? '🛡️ Ins. Pooled' : 'Own Ins.'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Dealer Portal ────────────────────────────────────────── */}
        {activeTab === 'dealer_portal' && (
          <div className="gb-dealer-console">
            <div className="gb-console-head">
              <div>
                <span className="gb-eyebrow">DEALERSHIP SALES DESK</span>
                <h2 className="gb-section-title">Participating Dealership & Broker Bidding Portal</h2>
                <p className="gb-section-desc">
                  Submit confidential on-road pricing for high-volume buyer pools. <br />
                  <strong>Sealed-Bid Integrity:</strong> Competing dealerships cannot view your pricing, margins, or discounts.
                </p>
              </div>
              <div className="gb-dealer-selector">
                <label>Active Dealership Account:</label>
                <select
                  value={quoteForm.dealer_id}
                  onChange={(e) => setQuoteForm({ ...quoteForm, dealer_id: Number(e.target.value) })}
                >
                  <option value={1}>Apex Hyundai (South & West Mumbai)</option>
                  <option value={2}>Shreenath Hyundai (Western Suburbs)</option>
                  <option value={3}>Modi Hyundai (Central Mumbai & Thane)</option>
                  <option value={4}>CareShield Direct (Insurance Corporate Agency)</option>
                </select>
              </div>
            </div>

            <div className="gb-dealer-grid">
              {/* Submission Form */}
              <div className="gb-quote-card">
                <h3 className="gb-card-heading">Submit or Revise Sealed Quotation</h3>
                <form onSubmit={handleDealerQuoteSubmit}>
                  <div className="gb-form-row">
                    <div className="gb-form-group">
                      <label>Target Pool</label>
                      <select
                        value={selectedGroup?.id || ''}
                        onChange={(e) => handleSelectGroup(Number(e.target.value))}
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title} ({g.member_count}/{g.target_members} Buyers)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="gb-form-group">
                      <label>Ex-Showroom Price (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.ex_showroom_price}
                        onChange={(e) => setQuoteForm({ ...quoteForm, ex_showroom_price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="gb-form-row">
                    <div className="gb-form-group">
                      <label>RTO Road Tax (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.rto_road_tax}
                        onChange={(e) => setQuoteForm({ ...quoteForm, rto_road_tax: e.target.value })}
                        required
                      />
                    </div>
                    <div className="gb-form-group">
                      <label>Negotiated Group Insurance (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.insurance_rate_group}
                        onChange={(e) => setQuoteForm({ ...quoteForm, insurance_rate_group: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="gb-form-row">
                    <div className="gb-form-group">
                      <label>Group Cash Discount (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.group_cash_discount}
                        onChange={(e) => setQuoteForm({ ...quoteForm, group_cash_discount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="gb-form-group">
                      <label>Exchange / Corporate Bonus (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.corporate_exchange_bonus}
                        onChange={(e) => setQuoteForm({ ...quoteForm, corporate_exchange_bonus: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="gb-form-group">
                    <label>Additional Exclusive Perks (Comma-separated)</label>
                    <input
                      type="text"
                      value={quoteForm.additional_perks}
                      onChange={(e) => setQuoteForm({ ...quoteForm, additional_perks: e.target.value })}
                    />
                  </div>

                  <div className="gb-form-row">
                    <div className="gb-form-group">
                      <label>Delivery Timeline (Weeks)</label>
                      <input
                        type="number"
                        value={quoteForm.delivery_timeline_weeks}
                        onChange={(e) => setQuoteForm({ ...quoteForm, delivery_timeline_weeks: e.target.value })}
                        required
                      />
                    </div>
                    <div className="gb-form-group">
                      <label>Booking Amount per Member (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.booking_amount}
                        onChange={(e) => setQuoteForm({ ...quoteForm, booking_amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                    Submit Sealed Quotation
                  </button>
                </form>
              </div>

              {/* Demand Details & Benefits */}
              <div className="gb-dealer-info-card">
                <h3>Why Dealerships Compete on TorqueTrader</h3>
                <ul className="gb-benefit-list">
                  <li>
                    <strong>Zero Customer Acquisition Cost:</strong> Acquire 20 qualified, high-intent buyers in a single negotiation.
                  </li>
                  <li>
                    <strong>Direct OEM Target Relief:</strong> Bulk month-end quota fulfillment unlocks direct manufacturer backend rebates.
                  </li>
                  <li>
                    <strong>Immediate Stock Turnover:</strong> Clear 20 allocated inventory units with guaranteed 10-day handover.
                  </li>
                  <li>
                    <strong>High Service Retention:</strong> Long-term aftersales revenue across 20 vehicle lifecycles in Mumbai MMR.
                  </li>
                </ul>

                <div className="gb-disclaimer-box">
                  <strong>Sealed-Bid Mechanism:</strong> Quotes remain encrypted and sealed until the platform deadline. No dealership can undercut by ₹1 after seeing competitors.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Admin Console ────────────────────────────────────────── */}
        {activeTab === 'admin_console' && (
          <div className="gb-admin-console">
            <div className="gb-console-head">
              <div>
                <span className="gb-eyebrow">PLATFORM CONTROLLER</span>
                <h2 className="gb-section-title">Group Buying Platform Operations & Governance</h2>
                <p className="gb-section-desc">
                  Monitor aggregated purchasing demand, verify participating dealerships, authorize quotation requests, and unseal side-by-side offers.
                </p>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="gb-admin-metrics-row">
              <div className="dash-stat-card">
                <span className="stat-label">Active Buyer Groups</span>
                <div className="stat-val">{metrics?.total_active_groups || groups.length}</div>
                <span className="stat-sub">Across Mumbai, Delhi, Bangalore</span>
              </div>
              <div className="dash-stat-card">
                <span className="stat-label">Ready Pooled Buyers</span>
                <div className="stat-val" style={{ color: 'var(--accent)' }}>
                  {metrics?.total_ready_buyers || 32}
                </div>
                <span className="stat-sub">High-Intent Verified Leads</span>
              </div>
              <div className="dash-stat-card">
                <span className="stat-label">Verified Dealers / Insurers</span>
                <div className="stat-val">{metrics?.total_verified_dealers || 4}</div>
                <span className="stat-sub">Authorized Institutional Desks</span>
              </div>
              <div className="dash-stat-card">
                <span className="stat-label">Total Community Savings</span>
                <div className="stat-val" style={{ color: 'var(--green-dark)' }}>
                  ₹{Number((metrics?.total_estimated_community_savings_inr || 7463775) / 100000).toFixed(1)}L
                </div>
                <span className="stat-sub">Calculated vs. Retail List Price</span>
              </div>
            </div>

            {/* Admin Management Table */}
            <div className="gb-admin-table-card">
              <h3 className="gb-sub-title">Pool Management & Lifecycle Controls</h3>
              <table className="gb-compare-table">
                <thead>
                  <tr>
                    <th>Group Ref</th>
                    <th>Vehicle / Pool</th>
                    <th>City</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.group_ref}</strong>
                      </td>
                      <td>{g.title}</td>
                      <td>{g.city}</td>
                      <td>
                        {g.member_count} / {g.target_members}
                      </td>
                      <td>
                        <span className={`gb-status-badge ${g.status}`}>
                          {g.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedGroup(g);
                              handleAdminRequestQuotes();
                            }}
                          >
                            Request Dealer Quotes
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedGroup(g);
                              handleAdminReleaseOffers();
                            }}
                          >
                            Unseal & Publish Offers
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Join Group Modal ──────────────────────────────────────────────── */}
      {showJoinModal && selectedGroup && (
        <div className="gb-modal-overlay">
          <div className="gb-modal-card">
            <div className="gb-modal-header">
              <h3>Join {selectedGroup.title}</h3>
              <button
                type="button"
                className="gb-close-btn"
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit}>
              <div className="gb-form-row">
                <div className="gb-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={joinForm.buyer_name}
                    onChange={(e) => setJoinForm({ ...joinForm, buyer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="gb-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={joinForm.buyer_email}
                    onChange={(e) => setJoinForm({ ...joinForm, buyer_email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="gb-form-row">
                <div className="gb-form-group">
                  <label>Mobile Number (For Dealership OTP / Call)</label>
                  <input
                    type="tel"
                    value={joinForm.buyer_phone}
                    onChange={(e) => setJoinForm({ ...joinForm, buyer_phone: e.target.value })}
                    required
                  />
                </div>
                <div className="gb-form-group">
                  <label>Preferred Color Choice</label>
                  <input
                    type="text"
                    value={joinForm.selected_color}
                    onChange={(e) => setJoinForm({ ...joinForm, selected_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="gb-form-row">
                <div className="gb-form-group">
                  <label>Purchase Timeline</label>
                  <select
                    value={joinForm.purchase_timeline}
                    onChange={(e) => setJoinForm({ ...joinForm, purchase_timeline: e.target.value })}
                  >
                    <option value="Immediate (Within 10 Days)">Immediate (Within 10 Days)</option>
                    <option value="Within 15 Days">Within 15 Days</option>
                    <option value="Within 30 Days">Within 30 Days</option>
                    <option value="Next Month">Next Month</option>
                  </select>
                </div>
                <div className="gb-form-group">
                  <label>Purchase Readiness</label>
                  <select
                    value={joinForm.purchase_readiness}
                    onChange={(e) => setJoinForm({ ...joinForm, purchase_readiness: e.target.value })}
                  >
                    <option value="ready_to_buy">Firm Buyer (Cash/Loan Pre-approved)</option>
                    <option value="researching">Evaluating Group Price</option>
                  </select>
                </div>
              </div>

              {/* Group Insurance Opt-in Checkbox */}
              <div className="gb-checkbox-box">
                <label className="gb-checkbox-label">
                  <input
                    type="checkbox"
                    checked={joinForm.pool_group_insurance}
                    onChange={(e) => setJoinForm({ ...joinForm, pool_group_insurance: e.target.checked })}
                  />
                  <span>
                    <strong>Include in Group Motor Insurance Pool (Recommended)</strong>
                    <br />
                    <small>
                      Save ₹25,000–₹40,000 on dealership insurance with negotiated group rates (Zero-Dep + RTI included).
                    </small>
                  </span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                Confirm Group Membership
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Group Modal ────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="gb-modal-overlay">
          <div className="gb-modal-card">
            <div className="gb-modal-header">
              <h3>Start a New Buyer Pool</h3>
              <button
                type="button"
                className="gb-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="gb-form-group">
                <label>Pool Type</label>
                <select
                  value={createForm.group_type}
                  onChange={(e) => setCreateForm({ ...createForm, group_type: e.target.value })}
                >
                  <option value="car_purchase">New Car Purchase Group</option>
                  <option value="insurance_renewal">Standalone Motor Insurance Renewal Pool</option>
                </select>
              </div>

              <div className="gb-form-row">
                <div className="gb-form-group">
                  <label>Pool Title</label>
                  <input
                    type="text"
                    value={createForm.title}
                    placeholder="e.g. Mumbai Creta SX(O) Petrol IVT Buyer Group"
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="gb-form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              {createForm.group_type === 'car_purchase' ? (
                <div className="gb-form-row">
                  <div className="gb-form-group">
                    <label>Target Make & Model</label>
                    <select
                      value={createForm.target_model}
                      onChange={(e) => {
                        const item = catalog.find((c) => c.model === e.target.value);
                        if (item) {
                          setCreateForm({
                            ...createForm,
                            target_make: item.make,
                            target_model: item.model,
                            target_variant: item.variant,
                            fuel_type: item.fuel_type,
                            transmission: item.transmission,
                          });
                        }
                      }}
                    >
                      {catalog.map((c) => (
                        <option key={c.id} value={c.model}>
                          {c.make} {c.model} ({c.variant})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="gb-form-group">
                    <label>Target Member Threshold</label>
                    <input
                      type="number"
                      value={createForm.target_members}
                      onChange={(e) => setCreateForm({ ...createForm, target_members: Number(e.target.value) })}
                      min={2}
                      max={100}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="gb-form-group">
                  <label>Target Insurance Provider / Model</label>
                  <select
                    value={createForm.target_insurer}
                    onChange={(e) => setCreateForm({ ...createForm, target_insurer: e.target.value })}
                  >
                    <option value="Multi-Insurer Bidding">Multi-Insurer Bidding (Best Price Auction)</option>
                    <option value="HDFC ERGO General Insurance">HDFC ERGO General Insurance</option>
                    <option value="Tata AIG General Insurance">Tata AIG General Insurance</option>
                    <option value="ICICI Lombard">ICICI Lombard</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                Create Group & Open for Members
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Offer Decision / Callback Modal ──────────────────────────────── */}
      {showDecisionModal && targetQuote && selectedGroup && (
        <div className="gb-modal-overlay">
          <div className="gb-modal-card">
            <div className="gb-modal-header">
              <h3>Connect with {targetQuote.dealer_name}</h3>
              <button
                type="button"
                className="gb-close-btn"
                onClick={() => setShowDecisionModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="gb-quote-summary-pill">
              <div>
                <strong>Quoted Net On-Road:</strong> ₹{Number(targetQuote.final_net_on_road).toLocaleString('en-IN')}
              </div>
              <div className="gb-tag-green">
                Save ₹{Number(targetQuote.total_group_discount).toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleDecisionSubmit}>
              <div className="gb-form-group">
                <label>Preferred Action</label>
                <select
                  value={decisionForm.decision}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                >
                  <option value="callback_requested">Request Official Dealership Callback</option>
                  <option value="booking_initiated">Initiate Booking Token (₹{Number(targetQuote.booking_amount).toLocaleString('en-IN')})</option>
                  <option value="interested">Mark as Interested (Hold Price)</option>
                </select>
              </div>

              <div className="gb-form-group">
                <label>Preferred Contact Mode</label>
                <select
                  value={decisionForm.preferred_contact_method}
                  onChange={(e) => setDecisionForm({ ...decisionForm, preferred_contact_method: e.target.value })}
                >
                  <option value="whatsapp">WhatsApp Consultation</option>
                  <option value="phone">Phone Call from Sales Manager</option>
                  <option value="email">Email Official Price Breakdown PDF</option>
                </select>
              </div>

              <div className="gb-form-group">
                <label>Specific Notes or Financing Requirement</label>
                <textarea
                  rows={3}
                  value={decisionForm.notes}
                  onChange={(e) => setDecisionForm({ ...decisionForm, notes: e.target.value })}
                  placeholder="Need loan pre-approval, exchange quote for old car, etc."
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                Confirm & Route to Dealership
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
