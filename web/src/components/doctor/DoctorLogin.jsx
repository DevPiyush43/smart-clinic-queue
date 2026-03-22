import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { doctorLogin, isAuthenticated, user } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'doctor') {
      navigate('/doctor', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    if (!phone || !password) return;
    setLoading(true);
    try {
      await doctorLogin(phone, password);
      toast.success('Welcome, Doctor! 🩺');
      navigate('/doctor', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(165deg,#0B1120 0%,#0F2448 55%,#0B1120 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '36px 28px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg,#0B1120,#3B82F6)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
            🩺
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Doctor Portal</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Smart Clinic Queue Dashboard</div>
        </div>

        {/* Fields */}
        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          style={{ width: '100%', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', borderColor: '#E2E8F0' }}
        />

        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>Password</label>
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px 44px 14px 16px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(135deg,#0B1120,#1e3a5f)', border: 'none', borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.8 : 1 }}
        >
          {loading ? '⏳ Logging in...' : '🔐 Login as Doctor'}
        </motion.button>


      </motion.div>
    </div>
  );
};

export default DoctorLogin;
