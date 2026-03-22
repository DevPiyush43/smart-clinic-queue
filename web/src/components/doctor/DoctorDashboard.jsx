import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useQueue from '../../hooks/useQueue';
import useSocket from '../../hooks/useSocket';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import { maskName, statusClass, statusLabel, formatDate, waitDisplay } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const CLINIC_ID = import.meta.env.VITE_CLINIC_ID || '';

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

// ── Doctor Dashboard ──────────────────────────────────────────────────
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

  useEffect(() => {
    fetchLive();
  }, []);

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics();
  }, [tab]);

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
      // Play chime for doctor too
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
      onConfirm: async () => {
        setConfirm(null);
        await closeSession();
      },
    });
  };

  const handleToggle = () => {
    setConfirm({
      title: isAcceptingNew ? 'Pause New Bookings' : 'Resume Bookings',
      message: isAcceptingNew
        ? 'Stop accepting new patients temporarily?'
        : 'Allow new patients to book again?',
      confirmLabel: isAcceptingNew ? 'Pause' : 'Resume',
      onConfirm: async () => {
        setConfirm(null);
        await toggleAccepting(!isAcceptingNew);
      },
    });
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#0B1120', display: 'flex', alignItems: 'center', padding: '12px 18px', gap: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', background: '#3B82F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🩺</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Dr Sharma Clinic</div>
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
            <motion.div
              style={{ background: '#0B1120', borderRadius: '22px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}
            >
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

                {/* Bar chart */}
                {dailyData.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>Daily Patients (7 days)</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dailyData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                          formatter={(v, n) => [v, n === 'totalBooked' ? 'Booked' : n]}
                        />
                        <Bar dataKey="totalBooked" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="doneCount" fill="#10B981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11px', fontWeight: '700' }}>
                      <span><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3B82F6', display: 'inline-block', marginRight: '5px' }} />Booked</span>
                      <span><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981', display: 'inline-block', marginRight: '5px' }} />Done</span>
                    </div>
                  </div>
                )}

                {/* Hourly chart */}
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
                          {hourlyData.map((_, i) => (
                            <Cell key={i} fill={colors[i % colors.length]} />
                          ))}
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
            <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {[
                { icon: '🏥', label: 'Clinic Name', value: 'Dr Sharma Clinic' },
                { icon: '👨‍⚕️', label: 'Doctor', value: `Dr. ${user?.name || 'Sharma'}` },
                { icon: '📍', label: 'Location', value: 'Nashik, Maharashtra' },
                { icon: '📱', label: 'Phone', value: '+91 9000000000' },
                { icon: '⏱️', label: 'Avg. Time/Patient', value: '5 minutes' },
                { icon: '🕘', label: 'Working Hours', value: '9:00 AM – 6:00 PM' },
                { icon: '🔔', label: 'Heads Up Count', value: '2 patients early' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 18px', borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                  <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.value}</div>
                  </div>
                  <span style={{ color: '#C0CADC', fontSize: '16px' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm overlay */}
      <AnimatePresence>
        {confirm && (
          <ConfirmSheet
            {...confirm}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
