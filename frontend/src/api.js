import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://torquetrader.onrender.com',
  headers: { 'Content-Type': 'application/json' },
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
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const sendOtp    = (email)       => api.post('/auth/send-otp',    { email });
export const verifyOtp  = (email, otp)  => api.post('/auth/verify-otp',  { email, otp });
export const getMe      = ()            => api.get('/auth/me');
export const logout     = ()            => api.post('/auth/logout');

// ── Listings ──────────────────────────────────────────────────────────────
export const getListings = (params) => api.get('/listings/', { params });
export const createListing = (data) => api.post('/listings/', data);
export const updateListingStatus = (id, data) => api.patch(`/listings/${id}/status`, data);

// ── Leads ─────────────────────────────────────────────────────────────────
export const revealPhone    = (listingId) => api.post('/leads/reveal-phone',    { listing_id: listingId });
export const whatsappClick  = (listingId) => api.post('/leads/whatsapp-click',  { listing_id: listingId });

// ── Media ─────────────────────────────────────────────────────────────────
export const uploadBikePhoto = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/media/public/bike-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
