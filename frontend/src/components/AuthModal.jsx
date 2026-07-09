import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendOtp, verifyOtp, getMe } from '../api';
import { toast } from '../context/ToastContext';
import './AuthModal.css';

const OTP_LENGTH = 6;

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await sendOtp(email);
      setStep('otp');
      setCountdown(45);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // OTP box logic — auto-advance, backspace, paste
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    try {
      const { data } = await verifyOtp(email, code);
      const meRes = await getMe();
      login(data.access_token, meRes.data);
      toast.success('Welcome to TorqueTrader!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.every(d => d !== '') && step === 'otp') handleVerify();
  }, [otp]);

  return (
    <div className="auth-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal" role="dialog" aria-modal="true">
        <button className="auth-close" onClick={onClose} aria-label="Close">{'\u2715'}</button>

        <div className="auth-header">
          <div className="auth-wordmark">Torque<span>Trader</span></div>
          {step === 'email' ? (
            <>
              <h2 className="auth-title">Sign in to your account</h2>
              <p className="auth-subtitle">Enter your email and we'll send you a verification code</p>
            </>
          ) : (
            <>
              <h2 className="auth-title">Check your email</h2>
              <p className="auth-subtitle">We sent a 6-digit code to <strong>{email}</strong></p>
            </>
          )}
        </div>

        {step === 'email' ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button id="auth-send-otp-btn" type="submit" className="btn btn-primary" style={{ width:'100%', height:52 }} disabled={loading || !email}>
              {loading ? 'Sending…' : 'Continue with Email'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Verification code</label>
              <div className="otp-boxes">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    id={`otp-box-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-box ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            <div className="otp-resend">
              {countdown > 0 ? (
                <span className="resend-timer">Resend in 00:{String(countdown).padStart(2,'0')}</span>
              ) : (
                <button type="button" className="resend-btn" onClick={handleSendOtp} disabled={loading}>
                  Resend code
                </button>
              )}
            </div>

            <button id="auth-verify-btn" type="submit" className="btn btn-primary" style={{ width:'100%', height:52 }}
              disabled={loading || otp.some(d => d === '')}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width:'100%', marginTop:8 }}
              onClick={() => { setStep('email'); setOtp(Array(OTP_LENGTH).fill('')); }}>
              ← Use a different email
            </button>
          </form>
        )}

        <p className="auth-terms">
          By continuing, you agree to TorqueTrader's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
