import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as apiLogout, updateProfile } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('tt_token'));
  const [loading, setLoading] = useState(true);

  // On mount — verify token is still valid
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe()
      .then(({ data }) => setUser(data))
      .catch(() => { localStorage.removeItem('tt_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback((accessToken, userData) => {
    localStorage.setItem('tt_token', accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch (_) {}
    localStorage.removeItem('tt_token');
    setToken(null);
    setUser(null);
  }, []);

  const completeProfile = useCallback(async (profile) => {
    const { data } = await updateProfile(profile);
    setUser(data);
    return data;
  }, []);

  // New: Dedicated function for updating the profile from the /profile page
  const updateUserProfile = useCallback(async (profile) => {
    const { data } = await updateProfile(profile);
    setUser(data);
    return data;
  }, []);

  const isAdmin  = user?.role === 'admin';
  const isSeller = user?.role === 'individual_seller' || user?.role === 'dealer';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      completeProfile,
      updateUserProfile, // <-- Added here
      isAdmin,
      isSeller
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
