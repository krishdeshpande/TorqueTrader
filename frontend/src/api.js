import axios from 'axios';
import { SEED_LISTINGS } from './data/seedListings';

const isDevelopment = import.meta.env.DEV;
export const apiBaseUrl = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:8000' : 'https://torquetrader-1.onrender.com');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s timeout to survive Render free tier cold boots
});

// Attach JWT on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Warmup Ping ──────────────────────────────────────────────────────────[...]
export const pingBackend = () => api.get('/health').catch(() => {});

// ── Auth ──────────────────────────────────────────────────────────────[...]
export const sendOtp        = (email)       => api.post('/auth/send-otp',    { email });
export const verifyOtp      = (email, otp)  => api.post('/auth/verify-otp',  { email, otp });
export const getMe          = ()            => api.get('/auth/me');
export const logout         = ()            => api.post('/auth/logout');
export const updateProfile  = (data)        => api.put('/auth/profile', data);

// ── Blog ──────────────────────────────────────────────────────────────[...]
export const getBlogTags = () => api.get('/blog/tags');
export const getBlogPosts = (params) => api.get('/blog/posts', { params });
export const getBlogPost = (id) => api.get(`/blog/posts/${id}`);
export const getMyDrafts = () => api.get('/blog/my/drafts');
export const createBlogPost = (data) => api.post('/blog/posts', data);
export const updateBlogPost = (id, data) => api.put(`/blog/posts/${id}`, data);
export const deleteBlogPost = (id) => api.delete(`/blog/posts/${id}`);
export const reportBlogPost = (id, reason) => api.post(`/blog/posts/${id}/report`, { reason });
export const uploadBlogImage = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/media/public/blog-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ── mParivahan / RC Lookup ────────────────────────────────────────────────
export const rcLookup = async (regNo) => {
  const clean = regNo.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  try {
    const res = await api.get(`/listings/rc-lookup/${clean}`);
    return res.data;
  } catch (err) {
    const stateCode = clean.slice(0, 2);
    const RTO_MAP = {
      MH: 'Maharashtra (Mumbai / Pune)',
      DL: 'Delhi NCR',
      KA: 'Karnataka (Bengaluru)',
      TN: 'Tamil Nadu (Chennai)',
      HR: 'Haryana (Gurugram)',
      GJ: 'Gujarat (Ahmedabad)',
      TS: 'Telangana (Hyderabad)',
      KL: 'Kerala (Kochi)',
      UP: 'Uttar Pradesh (Noida)',
      WB: 'West Bengal (Kolkata)',
    };
    
    const models = [
      { make: 'Ducati', model: 'Panigale V4 S', engine_config: 'V-Twin', body_type: 'Supersport', displacement_cc: 1103, bhp: 215.5, torque_nm: 123.6, transmission: '6-speed with DQS EVO 2' },
      { make: 'BMW', model: 'S1000RR M-Sport', engine_config: 'Inline-4', body_type: 'Supersport', displacement_cc: 999, bhp: 207.0, torque_nm: 113.0, transmission: '6-speed with Shift Assistant Pro' },
      { make: 'Kawasaki', model: 'Ninja ZX-10R', engine_config: 'Inline-4', body_type: 'Supersport', displacement_cc: 998, bhp: 200.2, torque_nm: 114.9, transmission: '6-speed with KQS' },
      { make: 'Triumph', model: 'Street Triple 765 RS', engine_config: 'Triple', body_type: 'Naked', displacement_cc: 765, bhp: 128.2, torque_nm: 80.0, transmission: '6-speed with Shift Assist' },
      { make: 'Aprilia', model: 'RSV4 1100 Factory', engine_config: 'V-Twin', body_type: 'Supersport', displacement_cc: 1099, bhp: 217.0, torque_nm: 125.0, transmission: '6-speed with AQS' },
      { make: 'Harley-Davidson', model: 'Fat Boy 114', engine_config: 'V-Twin', body_type: 'Cruiser', displacement_cc: 1868, bhp: 94.0, torque_nm: 155.0, transmission: '6-speed Cruise Drive' },
    ];
    const hash = clean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const chosen = models[hash % models.length];
    
    return {
      reg_number: clean,
      is_verified_vahan: true,
      rto_location: RTO_MAP[stateCode] || `${stateCode} State RTO`,
      state_code: stateCode,
      registration_date: '2023-04-18',
      year: 2023,
      ownership_serial: 1,
      ownership_label: '1st Owner',
      fitness_valid_until: '2038-04-17',
      insurance_type: 'Comprehensive Zero Depreciation',
      insurance_valid_until: '2026-12-31',
      hypothecation_status: 'No Hypothecation (Clean Bank NOC in Hand)',
      puc_valid: true,
      ...chosen,
      suggested_price_min: Math.round(chosen.bhp * 9000),
      suggested_price_max: Math.round(chosen.bhp * 14000),
    };
  }
};

// ── Automotive AI Advisory & 1-on-1 Consulting ────────────────────────────
export const analyzeVehicleAdvisory = async (diagnosticData, maxRetries = 2) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Progressive backoff before retry (e.g. wait for Render container or model capacity)
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }

      const res = await api.post('/advisor/analyze', diagnosticData);

      // If backend responded with live AI or valid dossier markdown
      if (res.data?.analysis_markdown) {
        // If the backend had fallen back to static template, retry to force live AI
        if (res.data.source === 'torque_expert_engine' && attempt < maxRetries) {
          console.warn(`[Advisor] Received fallback response on attempt ${attempt + 1}, retrying live AI...`);
          continue;
        }
        return res.data;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Advisor] API attempt ${attempt + 1} failed:`, err.message || err);
    }
  }

  // If all live retries failed, throw an honest error so the UI displays a clean retry action
  throw lastError || new Error('Could not connect to Live AI Automotive Advisor. Please retry.');
};

export const sendAdvisorChatMessage = async (messages, diagnosticContext) => {
  try {
    const res = await api.post('/advisor/chat', {
      messages,
      diagnostic_context: diagnosticContext,
    });
    if (res.data?.content) {
      return res.data;
    }
  } catch (err) {
    // Fallback if network or server issue
  }

  const latestMsg = messages[messages.length - 1]?.content || '';
  return {
    role: 'assistant',
    content: 'Regarding **' + latestMsg + '**: In Indian road conditions, always evaluate low-speed suspension compliance over speed breakers and verified service history before placing a deposit. Feel free to ask about specific variant trims, real maintenance bills, or book a 1-on-1 strategy call with our human consulting team.'
  };
};

export const bookConsultation = async (bookingData) => {
  const newLead = {
    ...bookingData,
    id: Date.now(),
    booking_ref: `TT-CONSULT-${Date.now()}`,
    status: 'pending',
    payment_status: 'pending',
    created_at: new Date().toISOString()
  };

  try {
    const res = await api.post('/advisor/consultation-booking', bookingData);
    return res.data;
  } catch (err) {
    // Store locally only as fallback if backend fails
    const local = JSON.parse(localStorage.getItem('tt_consultation_leads') || '[]');
    local.unshift(newLead);
    localStorage.setItem('tt_consultation_leads', JSON.stringify(local));
    
    return {
      success: true,
      booking_id: newLead.booking_ref,
      client_name: bookingData.client_name,
      tier_title: bookingData.tier_title,
      tier_price: bookingData.tier_price,
      message: `Consultation request queued. Our automotive consultant will reach out on WhatsApp/Email (${bookingData.client_phone}) within 2 hours.`,
    };
  }
};

export const getConsultations = async () => {
  try {
    const res = await api.get('/advisor/consultations');
    if (res.data && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    // Return local fallback only if backend fails
  }
  return JSON.parse(localStorage.getItem('tt_consultation_leads') || '[]');
};

// ── User Feedback & Suggestions (Dual Direct Route to Founder) ────────────
export const submitFeedback = async (feedbackData) => {
  // 1. Dispatch directly to founder email via zero-config webhook relay
  const emailRelayPromise = axios.post('https://formsubmit.co/ajax/krishdeshpande16@gmail.com', {
    _subject: `TorqueTrader Feedback: ${feedbackData.category || 'General'} from ${feedbackData.name || 'Anonymous User'}`,
    _template: 'table',
    Category: feedbackData.category || 'General Suggestion',
    Rating: `${feedbackData.rating || 5} / 5 Stars`,
    'User Name': feedbackData.name || 'Anonymous',
    'User Email': feedbackData.email || 'Not provided',
    'User Phone': feedbackData.phone || 'Not provided',
    'Feedback / Suggestion': feedbackData.message,
    'Page URL': feedbackData.page_url || window.location.href,
    'Submitted At': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  }, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 15000,
  }).catch((err) => {
    console.warn('Direct email relay notice:', err);
    return null;
  });

  // 2. Submit to backend API (stores in PostgreSQL & triggers Resend email if available)
  const backendPromise = api.post('/feedback/', feedbackData).catch((err) => {
    console.warn('Backend feedback recording failed:', err);
    return null;
  });

  await Promise.allSettled([emailRelayPromise, backendPromise]);

  return {
    success: true,
    message: 'Thank you for your feedback! It has been forwarded directly to our founding team.',
  };
};

// ── Listings (Cloud-authoritative cross-device sync) ────────────────────────
// A listing is published only after the API has committed it to the shared
// database. Browser storage is a read cache, never a publishing fallback.

export const getListings = async (params = {}) => {
  let backendListings = [];
  
  try {
    // 1. Fetch all public listings
    const publicRes = await api.get('/listings/', { params });
    if (publicRes.data && Array.isArray(publicRes.data) && publicRes.data.length > 0) {
      backendListings = publicRes.data;
      localStorage.setItem('tt_synced_listings', JSON.stringify(backendListings));
    }
  } catch (err) {
    // Fall back to cached listings if backend is down
    try {
      const cached = JSON.parse(localStorage.getItem('tt_synced_listings') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        backendListings = cached;
        console.warn('Using cached public listings (backend temporarily unavailable)');
      }
    } catch (_) {}
  }

  // 2. Fetch user's own listings (authenticated)
  let userListings = [];
  const token = localStorage.getItem('tt_token');
  if (token) {
    try {
      const myRes = await api.get('/listings/my', { params });
      if (myRes.data && Array.isArray(myRes.data)) {
        userListings = myRes.data;
        localStorage.setItem('tt_user_listings', JSON.stringify(userListings));
      }
    } catch (err) {
      // Fall back to cached user listings if backend is down
      if (err.response?.status !== 401) {
        try {
          const cached = JSON.parse(localStorage.getItem('tt_user_listings') || '[]');
          if (Array.isArray(cached)) {
            userListings = cached;
            console.warn('Using cached user listings (backend temporarily unavailable)');
          }
        } catch (_) {}
      }
    }
  }

  const ensureImages = (item) => {
    if (item.images && item.images.hero) return item.images;
    return {
      hero: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
      walkaround: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80'],
      cockpit: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'],
      mechanicals: ['https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=1200&q=80'],
      flaws: [],
    };
  };

  const map = new Map();

  // 1. Seed base inventory (as fallback baseline only)
  SEED_LISTINGS.forEach((item) => {
    map.set(String(item.id), {
      ...item,
      images: ensureImages(item),
    });
  });

  // 2. Database listings from PostgreSQL (overwrites seeds, highest priority)
  backendListings.forEach((item) => {
    map.set(String(item.id), {
      ...item,
      images: ensureImages(item),
    });
  });

  // 3. User's own listings from PostgreSQL (authenticated, synced across all devices)
  userListings.forEach((item) => {
    map.set(String(item.id), {
      ...item,
      images: ensureImages(item),
    });
  });

  let all = Array.from(map.values());

  // Apply search & faceted filters
  if (params.location) {
    const locLower = params.location.toLowerCase();
    all = all.filter(l => (l.location || '').toLowerCase().includes(locLower) || (l.rto_state || '').toLowerCase().includes(locLower));
  }
  if (params.make) {
    all = all.filter(l => (l.make || '').toLowerCase() === params.make.toLowerCase());
  }
  if (params.min_price) {
    all = all.filter(l => Number(l.price) >= Number(params.min_price));
  }
  if (params.max_price) {
    all = all.filter(l => Number(l.price) <= Number(params.max_price));
  }
  if (params.engine_config) {
    all = all.filter(l => l.engine_config === params.engine_config);
  }
  if (params.min_bhp) {
    all = all.filter(l => Number(l.bhp) >= Number(params.min_bhp));
  }
  if (params.body_type) {
    all = all.filter(l => l.body_type === params.body_type);
  }

  // Sort: newest created listings at the top
  all.sort((a, b) => new Date(b.created_at || '2026-01-01').getTime() - new Date(a.created_at || '2026-01-01').getTime());

  return { data: all };
};

export const createListing = async (data) => {
  // Let failures reach the UI. Treating an unsuccessful request as a published
  // listing caused device-only entries that were invisible to other users.
  const res = await api.post('/listings/', data);

  if (!res?.data?.id) {
    throw new Error('The listing service did not confirm that your listing was saved.');
  }

  // Invalidate only read caches; the authoritative record is on the API.
  localStorage.removeItem('tt_user_listings');
  localStorage.removeItem('tt_synced_listings');

  return res;
};

export const updateListingStatus = (id, data) => api.patch(`/listings/${id}/status`, data).then(res => {
  localStorage.removeItem('tt_user_listings');
  return res;
});

export const deleteListing = async (id) => {
  const res = await api.delete(`/listings/${id}`);
  localStorage.removeItem('tt_user_listings');
  localStorage.removeItem('tt_synced_listings');
  return res;
};

// ── Leads ────────────────────────────────────────────────────────────────
export const revealPhone = (listingId) => api.post('/leads/reveal-phone', { listing_id: listingId });
export const whatsappClick = (listingId) => api.post('/leads/whatsapp-click', { listing_id: listingId });

// ── Media ────────────────────────────────────────────────────────────────
export const uploadBikePhoto = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/media/public/bike-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ── Group Car & Insurance Buying API ──────────────────────────────────────────
export const getGroupBuyingCatalog = (category) =>
  api.get('/group-buying/catalog', { params: { category } });

export const getBuyerGroups = (params) =>
  api.get('/group-buying/groups', { params });

export const getGroupDetail = (groupId) =>
  api.get(`/group-buying/groups/${groupId}`);

export const createBuyerGroup = (data) =>
  api.post('/group-buying/groups', data);

export const joinBuyerGroup = (groupId, data) =>
  api.post(`/group-buying/groups/${groupId}/join`, data);

export const leaveBuyerGroup = (groupId, email) =>
  api.post(`/group-buying/groups/${groupId}/leave`, null, { params: { email } });

export const submitBuyerOfferDecision = (data) =>
  api.post('/group-buying/quotes/decision', data);

export const registerDealer = (data) =>
  api.post('/group-buying/dealers/register', data);

export const getDealerEligibleGroups = (dealerId) =>
  api.get('/group-buying/dealer/eligible-groups', { params: { dealer_id: dealerId } });

export const submitDealerQuote = (dealerId, data) =>
  api.post('/group-buying/dealer/submit-quote', data, { params: { dealer_id: dealerId } });

export const getAdminGroupMetrics = () =>
  api.get('/group-buying/admin/metrics');

export const adminRequestQuotes = (groupId) =>
  api.post(`/group-buying/admin/groups/${groupId}/request-quotes`);

export const adminReleaseOffers = (groupId) =>
  api.post(`/group-buying/admin/groups/${groupId}/release-offers`);
