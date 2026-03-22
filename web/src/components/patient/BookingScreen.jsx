import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import useQueue from '../../hooks/useQueue';
import useAuthStore from '../../store/authStore';
import StatBox from '../shared/StatBox';
import BottomNav from '../shared/BottomNav';
import { formatDate, waitDisplay } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CLINIC_ID = import.meta.env.VITE_CLINIC_ID || '69c05cdad14e24fd7cf02dec';

const BookingScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookToken, myToken, fetchMyToken, cancelToken, currentToken, queueLength } = useQueue(CLINIC_ID);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchMyToken();
  }, []);

  const handleBook = async () => {
    setLoading(true);
    try {
      await bookToken(notes);
      toast.success('Token booked successfully! 🎉');
      setNotes('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Booking failed';
      toast.error(msg);
      if (err?.response?.data?.token) {
        fetchMyToken(); // Refresh if already has token
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!myToken) return;
    try {
      await cancelToken(myToken._id);
      setShowConfirm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel token');
    }
  };

  // ── Confirmed view ──
  if (myToken && ['waiting', 'next', 'serving'].includes(myToken.status)) {
    const qrValue = myToken.qrData || JSON.stringify({
      displayToken: myToken.displayToken || `#${myToken.tokenNumber}`,
      clinicName: 'Smart Clinic',
      date: formatDate(myToken.bookedAt),
      patientName: user?.name,
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F8FAFC' }}>
          <button onClick={() => navigate('/home')} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <span style={{ fontSize: '17px', fontWeight: '700' }}>Appointment Confirmed</span>
        </div>

        <div className="scroll-area" style={{ flex: 1, padding: '8px 0' }}>
          {/* Token card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ background: '#3B82F6', margin: '0 16px', borderRadius: '22px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Your Token Number</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '72px', fontWeight: '900', color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {myToken.displayToken || `#${myToken.tokenNumber}`}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '6px' }}>
              Smart Clinic · {formatDate(myToken.bookedAt)}
            </div>
            <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 16px', display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
              ✅ Booking Confirmed
            </div>
          </motion.div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '10px', padding: '14px 16px 0' }}>
            <StatBox value={Math.max(0, (myToken.position || 1) - 1)} label="Ahead of You" color="#3B82F6" />
            <StatBox value={waitDisplay((myToken.position || 1) * 5)} label="Est. Wait" color="#F59E0B" />
            <StatBox value={currentToken || 0} label="Serving Now" color="#10B981" />
          </div>

          {/* Details */}
          <div className="card" style={{ margin: '14px 16px 0' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Appointment Details</div>
            {[
              ['Patient', user?.name || '—'],
              ['Token', myToken.displayToken || `#${myToken.tokenNumber}`],
              ['Doctor', 'Doctor on Duty'],
              ['Date', formatDate(myToken.bookedAt)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{k}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: k === 'Token' ? '#3B82F6' : '#0f172a' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Status</span>
              <span style={{ background: '#DCFCE7', color: '#15803D', borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: '800' }}>Confirmed</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="card" style={{ margin: '14px 16px 0', background: '#3B82F6', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Scan at Clinic Counter</div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
              <QRCode value={qrValue} size={140} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '14px 16px 4px' }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/tracker')}
              style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              📡 Track My Queue Live →
            </motion.button>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1D4ED8', margin: '12px 16px 0' }}>
            <span style={{ fontSize: '18px' }}>🔔</span>
            <span>You'll be notified 2 patients before your turn. Stay nearby!</span>
          </div>

          <div style={{ textAlign: 'center', padding: '16px' }}>
            <button
              onClick={() => setShowConfirm(true)}
              style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancel Token
            </button>
          </div>

          <div style={{ height: '20px' }} />
        </div>

        {/* Cancel Confirm Modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 999 }}
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '430px' }}
              >
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Cancel Token?</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Cancel token {myToken.displayToken || `#${myToken.tokenNumber}`}? This cannot be undone.</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Keep Token</button>
                  <button onClick={handleCancel} style={{ flex: 1, background: '#EF4444', border: 'none', borderRadius: '14px', padding: '14px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel It</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    );
  }

  // ── Booking form ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
        <button onClick={() => navigate('/home')} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <span style={{ fontSize: '17px', fontWeight: '700' }}>Book Appointment</span>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px' }}>
        <div style={{ background: '#3B82F6', borderRadius: '20px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏥</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Smart Clinic</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>Nashik · Now Serving: #{currentToken || '—'}</div>
          <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '3px 10px', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#fff' }}>
            {queueLength} in queue · ~{queueLength * 5} min wait
          </div>
        </div>

        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>
          Describe Your Concern (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Fever and cough for 2 days..."
          rows={3}
          style={{ width: '100%', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', fontSize: '15px', color: '#0f172a', fontFamily: 'inherit', outline: 'none', background: '#fff', resize: 'none', marginBottom: '20px' }}
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleBook}
          disabled={loading}
          style={{ width: '100%', background: '#3B82F6', border: 'none', borderRadius: '16px', padding: '17px', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '⏳ Booking...' : '✅ Confirm Booking'}
        </motion.button>

        <div style={{ height: '20px' }} />
      </div>

      <BottomNav />
    </div>
  );
};

export default BookingScreen;
