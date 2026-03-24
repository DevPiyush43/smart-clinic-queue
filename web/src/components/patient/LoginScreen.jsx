import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { sendOtp, isAuthenticated } = useAuth();
  const [contact, setContact] = useState('');
  const [inputMode, setInputMode] = useState('email'); // 'email' | 'phone'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isPhone = (val) => /^\d{10}$/.test(val);
  const isValid = inputMode === 'email' ? isEmail(contact) : isPhone(contact);

  const handleChange = (val) => {
    if (inputMode === 'phone') {
      setContact(val.replace(/\D/g, '').slice(0, 10));
    } else {
      setContact(val);
    }
  };

  const handleSend = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await sendOtp(contact.trim());
      toast.success(res.message || 'OTP sent!');
      navigate('/verify', { state: { contact: contact.trim(), method: res.method, devOtp: res.otp } });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-40px', opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}
    >
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F8FAFC' }}>
        <button
          onClick={() => navigate('/')}
          style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ←
        </button>
        <span style={{ fontSize: '17px', fontWeight: '700' }}>Login</span>
      </div>

      <div style={{ padding: '12px 16px', flex: 1 }}>
        {/* Clinic Card */}
        <div style={{ background: '#3B82F6', borderRadius: '20px', padding: '22px', textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏥</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '3px' }}>Smart Clinic</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Nashik · Mon–Sat · 9:00am – 6:00pm</div>
          <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 12px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#fff' }}>
            🟢 Open Now
          </div>
        </div>

        {/* Toggle email / phone */}
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '14px', padding: '4px', marginBottom: '16px' }}>
          {[
            { key: 'email', label: '✉️ Email OTP' },
            { key: 'phone', label: '📱 Mobile OTP' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setInputMode(t.key); setContact(''); }}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '11px',
                padding: '10px',
                background: inputMode === t.key ? '#fff' : 'transparent',
                boxShadow: inputMode === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                color: inputMode === t.key ? '#0f172a' : '#64748b',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input */}
        {inputMode === 'email' ? (
          <>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="patient@example.com"
              value={contact}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && isValid && handleSend()}
              style={{
                width: '100%',
                border: `2px solid ${isEmail(contact) ? '#3B82F6' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '15px 16px',
                fontSize: '15px',
                color: '#0f172a',
                fontFamily: 'inherit',
                outline: 'none',
                background: '#fff',
                boxSizing: 'border-box',
                marginBottom: '6px',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '22px' }}>
              📧 We'll send a 4-digit OTP to your email inbox
            </div>
          </>
        ) : (
          <>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>
              Mobile Number
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '72px', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '15px 8px', fontSize: '14px', fontWeight: '700', color: '#0f172a', background: '#fff', textAlign: 'center', flexShrink: 0 }}>
                +91
              </div>
              <input
                type="tel"
                placeholder="98765 43210"
                maxLength={10}
                value={contact}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isValid && handleSend()}
                style={{ flex: 1, border: `2px solid ${isPhone(contact) ? '#3B82F6' : '#E2E8F0'}`, borderRadius: '14px', padding: '15px 16px', fontSize: '16px', color: '#0f172a', fontFamily: 'inherit', outline: 'none', background: '#fff', transition: 'border-color 0.2s' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '22px' }}>
              We'll send a 4-digit OTP to verify
            </div>
          </>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={!isValid || loading}
          style={{
            width: '100%',
            background: isValid ? '#3B82F6' : '#E2E8F0',
            border: 'none',
            borderRadius: '16px',
            padding: '17px',
            color: isValid ? '#fff' : '#94a3b8',
            fontSize: '16px',
            fontWeight: '700',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ Sending...' : 'Send OTP'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LoginScreen;
