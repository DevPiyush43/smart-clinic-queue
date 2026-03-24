import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const OtpScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, sendOtp } = useAuth();
  const { contact, method, devOtp } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (!contact) navigate('/login', { replace: true });
    refs[0].current?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-fill in dev mode
  useEffect(() => {
    if (devOtp) {
      toast('Dev mode – OTP auto-filled: ' + devOtp, { icon: '🔑' });
    }
  }, []);

  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 3) refs[idx + 1].current?.focus();
    if (newOtp.every((d) => d !== '')) {
      setTimeout(() => verify(newOtp.join('')), 100);
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const verify = useCallback(async (code) => {
    setLoading(true);
    try {
      await verifyOtp(contact, code);
      toast.success('Welcome! 🎉');
      navigate('/home', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid OTP';
      toast.error(msg);
      setOtp(['', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  }, [contact, verifyOtp, navigate]);

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 4) verify(code);
  };

  const handleResend = async () => {
    setCountdown(30);
    setCanResend(false);
    try {
      await sendOtp(contact);
      toast.success('OTP resent!');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  // Mask display
  const isEmailContact = contact?.includes('@');
  const maskedContact = isEmailContact
    ? contact?.replace(/(.{2}).*(@.*)/, '$1***$2')
    : contact ? `+91 XXXXXX${contact.slice(-4)}` : '';

  const icon = isEmailContact ? '📧' : '📲';
  const label = isEmailContact ? 'Check your Email' : 'Check your SMS';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-40px', opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
        <button onClick={() => navigate('/login')} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <span style={{ fontSize: '17px', fontWeight: '700' }}>Verify OTP</span>
      </div>

      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>{icon}</div>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '28px' }}>
          OTP sent to <strong>{maskedContact}</strong>
          {isEmailContact && (
            <div style={{ marginTop: '4px', color: '#94a3b8', fontSize: '12px' }}>
              Check your spam folder if not received
            </div>
          )}
        </div>

        {/* OTP boxes */}
        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center', display: 'block', marginBottom: '12px' }}>
          Enter 4-digit OTP
        </label>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={refs[i]}
              className={`otp-box ${digit ? 'filled' : ''}`}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              disabled={loading}
            />
          ))}
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
          {canResend ? (
            <span onClick={handleResend} style={{ color: '#3B82F6', fontWeight: '700', cursor: 'pointer' }}>↺ Resend OTP</span>
          ) : (
            <>Resend in <span style={{ fontWeight: '700' }}>{countdown}s</span></>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleVerify}
          disabled={otp.join('').length < 4 || loading}
          style={{
            width: '100%',
            background: otp.join('').length === 4 ? '#3B82F6' : '#E2E8F0',
            border: 'none',
            borderRadius: '16px',
            padding: '17px',
            color: otp.join('').length === 4 ? '#fff' : '#94a3b8',
            fontSize: '16px',
            fontWeight: '700',
            cursor: otp.join('').length === 4 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}
        >
          {loading ? '⏳ Verifying...' : 'Verify & Continue'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default OtpScreen;
