import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: '⚡', title: 'Instant Booking', sub: 'Get a token in under 30 seconds' },
  { icon: '📡', title: 'Live Queue Tracking', sub: 'Watch your position update in real-time' },
  { icon: '🔔', title: 'Smart Notifications', sub: 'Alerted 2 patients before your turn' },
];

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg,#0B1120 0%,#0F2448 55%,#0B1120 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 24px',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          width: '88px',
          height: '88px',
          background: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '38px',
          marginBottom: '22px',
          boxShadow: '0 16px 48px rgba(59,130,246,0.4)',
        }}
      >
        🏥
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '30px',
          fontWeight: '900',
          color: '#fff',
          lineHeight: 1.2,
          marginBottom: '10px',
        }}
      >
        Smart Clinic<br />Queue
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.65, marginBottom: '32px' }}
      >
        Skip waiting in long lines. Book your spot,<br />
        track live, get notified before your turn.
      </motion.div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '36px' }}>
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '1px' }}>{f.title}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{f.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/login')}
        style={{
          width: '100%',
          background: '#3B82F6',
          border: 'none',
          borderRadius: '16px',
          padding: '17px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '700',
          cursor: 'pointer',
          fontFamily: 'inherit',
          letterSpacing: '0.2px',
          boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
        }}
      >
        Get Started →
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{ marginTop: '14px', fontSize: '12px', color: '#334155' }}
      >
        Powered by Smart Clinic Queue v2.0
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{ marginTop: '10px', fontSize: '12px', color: '#3B82F6', cursor: 'pointer' }}
      >
        📱 Available on Android
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
