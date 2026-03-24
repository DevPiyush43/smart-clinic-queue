import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useQueue from '../../hooks/useQueue';
import useSocket from '../../hooks/useSocket';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import { maskName, statusClass, statusLabel, formatDate, waitDisplay } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CLINIC_ID = import.meta.env.VITE_CLINIC_ID || '69c05cdad14e24fd7cf02dec';

// ── Tab definitions ────────────────────────────────────────────────────
const TABS = [
  { key: 'queue', icon: '🩺', label: 'Queue' },
  { key: 'analytics', icon: '📊', label: 'Analytics' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

// ── Confirm overlay ────────────────────────────────────────────────────
const ConfirmSheet = ({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 400 }}
      onClick={(e) => e.stopPropagation()}
      style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '22px 20px 36px', width: '100%', maxWidth: '520px' }}
    >
      <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{message}</div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, background: danger ? '#EF4444' : '#3B82F6', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>{confirmLabel}</button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Editable field row ─────────────────────────────────────────────────
const SettingRow = ({ icon, label, value, onSave, type = 'text', options = null }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      toast.success('Saved!');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderBottom: '1px solid #F8FAFC' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 18px', cursor: 'pointer' }}
        onClick={() => !editing && setEditing(true)}
      >
        <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{label}</div>
          {!editing && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{value || '—'}</div>}
        </div>
        {!editing && <span style={{ color: '#C0CADC', fontSize: '16px' }}>✏️</span>}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '0 18px 14px' }}
          >
            {options ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{ width: '100%', border: '2px solid #3B82F6', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#fff' }}
              >
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                style={{ width: '100%', border: '2px solid #3B82F6', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                autoFocus
              />
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => { setEditing(false); setDraft(value); }}
                style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, background: '#3B82F6', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}
              >
                {saving ? '⏳' : '✓ Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── WorkingHours edit ──────────────────────────────────────────────────
const WorkingHoursRow = ({ startTime, endTime, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(startTime);
  const [end, setEnd] = useState(endTime);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setStart(startTime); setEnd(endTime); }, [startTime, endTime]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ start, end });
      setEditing(false);
      toast.success('Working hours updated!');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  return (
    <div style={{ borderBottom: '1px solid #F8FAFC' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 18px', cursor: 'pointer' }}
        onClick={() => !editing && setEditing(true)}
      >
        <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>🕘</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Working Hours</div>
          {!editing && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{fmt(startTime)} – {fmt(endTime)}</div>}
        </div>
        {!editing && <span style={{ color: '#C0CADC', fontSize: '16px' }}>✏️</span>}
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '0 18px 14px' }}
          >
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Start</div>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                  style={{ width: '100%', border: '2px solid #3B82F6', borderRadius: '10px', padding: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>End</div>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                  style={{ width: '100%', border: '2px solid #3B82F6', borderRadius: '10px', padding: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#3B82F6', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                {saving ? '⏳' : '✓ Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Working Days picker ────────────────────────────────────────────────
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WorkingDaysRow = ({ days, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(days || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(days || []); }, [days]);

  const toggle = (d) => setSelected((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      setEditing(false);
      toast.success('Working days updated!');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderBottom: '1px solid #F8FAFC' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 18px', cursor: 'pointer' }}
        onClick={() => !editing && setEditing(true)}
      >
        <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>📅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Working Days</div>
          {!editing && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{(days || []).join(', ') || 'Not set'}</div>}
        </div>
        {!editing && <span style={{ color: '#C0CADC', fontSize: '16px' }}>✏️</span>}
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '0 18px 14px' }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggle(d)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '2px solid',
                    borderColor: selected.includes(d) ? '#3B82F6' : '#E2E8F0',
                    background: selected.includes(d) ? '#EFF6FF' : '#fff',
                    color: selected.includes(d) ? '#1D4ED8' : '#64748b',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#3B82F6', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                {saving ? '⏳' : '✓ Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── QR Scanner modal (camera-based via jsQR) ─────────────────────────
const QrScannerModal = ({ onClose, onScanned }) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let animFrame;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        scan();
      } catch (e) {
        setError('Camera access denied or not available.');
      }
    };

    const scan = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Use jsQR if available
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            stopCamera();
            onScanned(code.data);
            return;
          }
        }
      }
      animFrame = requestAnimationFrame(scan);
    };

    const stopCamera = () => {
      cancelAnimationFrame(animFrame);
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animFrame);
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
    >
      <div style={{ width: '100%', maxWidth: '360px', padding: '24px' }}>
        <div style={{ color: '#fff', fontWeight: '800', fontSize: '16px', marginBottom: '16px', textAlign: 'center' }}>
          📷 Scan Patient QR
        </div>
        {error ? (
          <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '16px', color: '#B91C1C', textAlign: 'center', fontSize: '14px' }}>{error}</div>
        ) : (
          <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', background: '#000' }}>
            <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* Scan overlay */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            }}>
              <div style={{ width: '180px', height: '180px', border: '3px solid #3B82F6', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
            </div>
          </div>
        )}
        <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>
          Point camera at patient's QR code
        </div>

        {/* Manual token ID fallback */}
        <ManualTokenInput onSubmit={onScanned} />

        <button
          onClick={onClose}
          style={{ marginTop: '14px', width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', padding: '13px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

const ManualTokenInput = ({ onSubmit }) => {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '8px', fontWeight: '600' }}>— or enter Token ID manually —</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          placeholder="Paste Token ID…"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }}
        />
        <button
          onClick={() => val.trim() && onSubmit(val.trim())}
          style={{ background: '#3B82F6', border: 'none', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ✓
        </button>
      </div>
    </div>
  );
};

// ─── Doctor Dashboard ──────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { currentToken, currentTokenName, queue, queueLength, doneCount, skippedCount, isAcceptingNew, fetchLive, callNext, skipPatient, closeSession, toggleAccepting } = useQueue(CLINIC_ID);
  useSocket(CLINIC_ID);

  const [tab, setTab] = useState('queue');
  const [analytics, setAnalytics] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [calling, setCalling] = useState(false);
  const [clinic, setClinic] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    fetchLive();
    loadClinic();
  }, []);

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics();
  }, [tab]);

  const loadClinic = async () => {
    try {
      const res = await api.get(`/clinic/${CLINIC_ID}`);
      setClinic(res.data.clinic);
    } catch (err) {
      console.error('Failed to load clinic', err);
    }
  };

  const saveClinic = async (fields) => {
    const res = await api.put(`/clinic/${CLINIC_ID}`, fields);
    setClinic(res.data.clinic);
  };

  const loadAnalytics = useCallback(async () => {
    try {
      const [sumRes, dailyRes, hourlyRes] = await Promise.all([
        api.get(`/analytics/summary?clinicId=${CLINIC_ID}`),
        api.get(`/analytics/daily?clinicId=${CLINIC_ID}&days=7`),
        api.get(`/analytics/hourly?clinicId=${CLINIC_ID}`),
      ]);
      setAnalytics(sumRes.data);
      setDailyData(dailyRes.data.data || []);
      setHourlyData(hourlyRes.data.data || []);
    } catch (err) {
      console.error('Analytics error:', err);
    }
  }, []);

  const handleCallNext = async () => {
    if (queue.length === 0) { toast.error('No patients in queue'); return; }
    setCalling(true);
    try {
      await callNext();
      try { new Audio('/sounds/chime.mp3').play().catch(() => {}); } catch (e) {}
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to call next');
    } finally {
      setCalling(false);
    }
  };

  const handleSkip = async (tokenId) => {
    try { await skipPatient(tokenId); } catch (err) { toast.error('Failed to skip'); }
  };

  const handleCloseSession = async () => {
    setConfirm({
      title: "Close Today's Queue",
      message: 'This will cancel all remaining tokens. Are you sure?',
      danger: true,
      confirmLabel: 'Close Queue',
      onConfirm: async () => { setConfirm(null); await closeSession(); },
    });
  };

  const handleToggle = () => {
    setConfirm({
      title: isAcceptingNew ? 'Pause New Bookings' : 'Resume Bookings',
      message: isAcceptingNew ? 'Stop accepting new patients temporarily?' : 'Allow new patients to book again?',
      confirmLabel: isAcceptingNew ? 'Pause' : 'Resume',
      onConfirm: async () => { setConfirm(null); await toggleAccepting(!isAcceptingNew); },
    });
  };

  // QR scan → mark serving done
  const handleQrScanned = async (rawData) => {
    setShowQrScanner(false);
    try {
      // rawData is either a tokenId directly or JSON with tokenId
      let tokenId;
      try {
        const parsed = JSON.parse(rawData);
        tokenId = parsed.tokenId || parsed._id;
      } catch {
        // Assume rawData is a plain tokenId string
        tokenId = rawData;
      }

      if (!tokenId) throw new Error('No tokenId found in QR');

      const res = await api.post('/queue/scan-qr', { clinicId: CLINIC_ID, tokenId });
      toast.success(res.data.message || '✅ Marked as done!');
      fetchLive();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'QR scan failed');
    }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#0B1120', display: 'flex', alignItems: 'center', padding: '12px 18px', gap: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', background: '#3B82F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🩺</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{clinic?.name || 'Smart Clinic'}</div>
          <div style={{ fontSize: '11px', color: '#475569' }}>Doctor Dashboard</div>
        </div>
        <div className="live-badge"><div className="live-dot" />LIVE</div>
        <button
          onClick={() => logout().then(() => window.location.href = '/')}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '7px 10px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: '13px 8px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: '700', color: tab === t.key ? '#3B82F6' : '#64748b', borderBottom: tab === t.key ? '2px solid #3B82F6' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="doc-main" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* ── QUEUE TAB ── */}
        {tab === 'queue' && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Big call button */}
            <motion.div style={{ background: '#0B1120', borderRadius: '22px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>NOW SERVING</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '72px', fontWeight: '900', color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {currentToken || '—'}
              </div>
              {currentTokenName && (
                <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>{currentTokenName}</div>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCallNext}
                disabled={calling || queueLength === 0}
                style={{ marginTop: '16px', width: '100%', background: queueLength > 0 ? '#10B981' : '#334155', border: 'none', borderRadius: '16px', padding: '18px', color: '#fff', fontSize: '18px', fontWeight: '800', cursor: queueLength > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Nunito', sans-serif", letterSpacing: '0.5px', transition: 'all 0.2s' }}
              >
                {calling ? '⏳ Calling...' : `➡️ Call Next (${queueLength} waiting)`}
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Done', value: doneCount, color: '#10B981', bg: '#DCFCE7' },
                { label: 'Waiting', value: queueLength, color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Skipped', value: skippedCount, color: '#F59E0B', bg: '#FEF3C7' },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: '14px', padding: '13px', textAlign: 'center', border: `1px solid ${s.color}22` }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={handleToggle}
                style={{ flex: 1, background: isAcceptingNew ? '#FEF3C7' : '#EFF6FF', border: `1px solid ${isAcceptingNew ? '#F59E0B44' : '#3B82F644'}`, borderRadius: '14px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: isAcceptingNew ? '#92400e' : '#1D4ED8' }}
              >
                {isAcceptingNew ? '⏸ Pause Bookings' : '▶ Resume Bookings'}
              </button>
              <button
                onClick={handleCloseSession}
                style={{ flex: 1, background: '#FEE2E2', border: '1px solid #EF444444', borderRadius: '14px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#B91C1C' }}
              >
                🔒 Close Session
              </button>
            </div>

            {/* QR Scan button */}
            <button
              onClick={() => setShowQrScanner(true)}
              style={{ width: '100%', background: '#fff', border: '2px solid #3B82F6', borderRadius: '14px', padding: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', color: '#3B82F6', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              📷 Scan Patient QR → Mark Done
            </button>

            {/* Queue list */}
            <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Queue ({queueLength})</div>
              </div>
              {queue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Queue is empty</div>
              ) : (
                queue.map((t, i) => (
                  <motion.div
                    key={t._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < queue.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: i === 0 ? '#3B82F6' : '#F1F5F9', color: i === 0 ? '#fff' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', fontFamily: "'Nunito', sans-serif", flexShrink: 0 }}>
                      {t.displayToken || `#${t.tokenNumber}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{t.patientName || 'Patient'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>~{t.estimatedWait || 0} min</div>
                    </div>
                    <button
                      onClick={() => handleSkip(t._id)}
                      style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}
                    >
                      Skip ↓
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {!analytics ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading analytics...</div>
            ) : (
              <>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '12px' }}>📊 Today's Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Served Today', value: analytics.today?.done || 0, color: '#10B981' },
                    { label: 'Remaining', value: analytics.today?.remaining || 0, color: '#3B82F6' },
                    { label: 'Avg per Day', value: analytics.weekly?.avgPerDay || 0, color: '#F59E0B' },
                    { label: 'Total Served', value: analytics.allTime?.totalServed || 0, color: '#8B5CF6' },
                  ].map((s) => (
                    <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '30px', fontWeight: '900', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {dailyData.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>Daily Patients (7 days)</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dailyData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} formatter={(v, n) => [v, n === 'totalBooked' ? 'Booked' : n]} />
                        <Bar dataKey="totalBooked" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="doneCount" fill="#10B981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {hourlyData.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>Hourly Distribution (Today)</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={hourlyData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {hourlyData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {!clinic ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading clinic data...</div>
            ) : (
              <>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>⚙️ Clinic Settings</div>
                <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '16px' }}>
                  <SettingRow
                    icon="🏥"
                    label="Clinic Name"
                    value={clinic.name}
                    onSave={(v) => saveClinic({ name: v })}
                  />
                  <SettingRow
                    icon="👨‍⚕️"
                    label="Doctor Name"
                    value={clinic.doctorName}
                    onSave={(v) => saveClinic({ doctorName: v })}
                  />
                  <SettingRow
                    icon="📍"
                    label="City / Location"
                    value={clinic.city}
                    onSave={(v) => saveClinic({ city: v })}
                  />
                  <SettingRow
                    icon="📍"
                    label="Address"
                    value={clinic.address}
                    onSave={(v) => saveClinic({ address: v })}
                  />
                  <SettingRow
                    icon="📱"
                    label="Clinic Phone"
                    value={clinic.phone}
                    type="tel"
                    onSave={(v) => saveClinic({ phone: v })}
                  />
                  <WorkingHoursRow
                    startTime={clinic.workingHours?.start || '09:00'}
                    endTime={clinic.workingHours?.end || '18:00'}
                    onSave={(wh) => saveClinic({ workingHours: wh })}
                  />
                  <WorkingDaysRow
                    days={clinic.workingDays || []}
                    onSave={(d) => saveClinic({ workingDays: d })}
                  />
                  <SettingRow
                    icon="⏱️"
                    label="Avg. Time per Patient (min)"
                    value={String(clinic.avgTimePerPatient || 5)}
                    type="number"
                    onSave={(v) => saveClinic({ avgTimePerPatient: parseInt(v) })}
                  />
                  <SettingRow
                    icon="🔔"
                    label="Heads Up Alert (patients before turn)"
                    value={String(clinic.headUpCount || 2)}
                    type="number"
                    onSave={(v) => saveClinic({ headUpCount: parseInt(v) })}
                  />
                  <SettingRow
                    icon="🏷️"
                    label="Token Prefix (e.g. A, TK)"
                    value={clinic.tokenPrefix || ''}
                    onSave={(v) => saveClinic({ tokenPrefix: v })}
                  />
                  <SettingRow
                    icon="👥"
                    label="Max Queue Size"
                    value={String(clinic.maxQueueSize || 100)}
                    type="number"
                    onSave={(v) => saveClinic({ maxQueueSize: parseInt(v) })}
                  />
                  {/* Toggle: Queue Public */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 18px' }}>
                    <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>👁️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Public Queue View</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Patients can see full queue</div>
                    </div>
                    <button
                      onClick={() => saveClinic({ queuePublic: !clinic.queuePublic })}
                      style={{
                        width: '50px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                        background: clinic.queuePublic ? '#3B82F6' : '#CBD5E1',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '11px', background: '#fff',
                        position: 'absolute', top: '3px', left: clinic.queuePublic ? '25px' : '3px',
                        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', color: '#1D4ED8' }}>
                  💡 All changes save immediately. Working hours affect whether new bookings are accepted.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirm overlay */}
      <AnimatePresence>
        {confirm && <ConfirmSheet {...confirm} onCancel={() => setConfirm(null)} />}
      </AnimatePresence>

      {/* QR Scanner overlay */}
      <AnimatePresence>
        {showQrScanner && (
          <QrScannerModal
            onClose={() => setShowQrScanner(false)}
            onScanned={handleQrScanned}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
