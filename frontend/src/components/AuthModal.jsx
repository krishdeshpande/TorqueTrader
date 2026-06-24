import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendOtp, verifyOtp, getMe } from '../api';
import { toast } from '../context/ToastContext';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [step, setStep]     = useState('email'); // 'email' | 'otp'
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendOtp(email);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await verifyOtp(email, otp);
      const meRes = await getMe();
      login(data.access_token, meRes.data);
      toast.success('Welcome to TorqueTrader!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div className="modal-logo">⚡</div>
          <h2 className="modal-title">
            {step === 'email' ? 'Sign in to TorqueTrader' : 'Enter your OTP'}
          </h2>
          <p className="modal-subtitle">
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form className="modal-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="auth-email-input"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button id="auth-send-otp-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="modal-form" onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">6-digit code</label>
              <input
                id="auth-otp-input"
                type="text"
                className="input input-otp"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button id="auth-verify-btn" type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={() => setStep('email')}>
              ← Change email
            </button>
          </form>
        )}

        <p className="modal-footer-note">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
