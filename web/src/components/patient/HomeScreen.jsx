import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useQueue from '../../hooks/useQueue';
import useSocket from '../../hooks/useSocket';
import StatBox from '../shared/StatBox';
import BottomNav from '../shared/BottomNav';
import { getGreeting, maskName, waitDisplay, calcProgress } from '../../utils/helpers';

const CLINIC_ID = import.meta.env.VITE_CLINIC_ID || '';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentToken, queueLength, doneCount, queue, isLoading, fetchLive, myToken, fetchMyToken } = useQueue(CLINIC_ID);
  useSocket(CLINIC_ID);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLive();
    fetchMyToken();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLive();
    await fetchMyToken();
    setRefreshing(false);
  };

  const progress = calcProgress(doneCount, queueLength);
  const name = user?.name || 'Patient';
  const greeting = getGreeting();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Scroll area */}
      <div className="scroll-area" style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ background: '#0B1120', padding: '14px 18px 22px', borderRadius: '0 0 26px 26px' }}>
          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '3px' }}>{greeting} 👋</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>{name}</div>
          {/* Clinic card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', background: '#3B82F6', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏥</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Dr Sharma Clinic</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>📍 Nashik, Maharashtra</div>
              </div>
              <div style={{ background: '#10B981', borderRadius: '20px', padding: '4px 11px', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>OPEN</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '10px', padding: '14px 16px 0' }}>
          <StatBox value={currentToken || 0} label="Now Serving" color="#3B82F6" />
          <StatBox value={queueLength || 0} label="In Queue" color="#10B981" />
          <StatBox value={waitDisplay(queueLength * 5)} label="Est. Wait" color="#F59E0B" />
        </div>

        {/* Progress */}
        {doneCount > 0 && (
          <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Queue Progress</span>
              <strong style={{ fontSize: '12px', color: '#3B82F6' }}>{progress}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Active token card OR book button */}
        <div style={{ padding: '16px 16px 0' }}>
          {myToken ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ background: 'linear-gradient(135deg,#3B82F6,#06B6D4)', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: '2px' }}>YOUR TOKEN</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '40px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>
                  {myToken.displayToken || `#${myToken.tokenNumber}`}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                  Position: #{myToken.position || '—'}
                </div>
              </div>
              <button
                onClick={() => navigate('/tracker')}
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '14px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Track Live →
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/booking')}
              style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              📋 Book Your Spot
            </motion.button>
          )}
        </div>

        {/* Queue Preview */}
        <div style={{ fontSize: '15px', fontWeight: '700', padding: '16px 16px 10px' }}>Live Queue Preview</div>
        <div className="card" style={{ margin: '0 16px' }}>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
              Queue is empty
            </div>
          ) : (
            queue.slice(0, 5).map((t, i) => (
              <div key={t._id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < 4 && i < queue.slice(0, 5).length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: myToken && t.tokenNumber === myToken.tokenNumber ? '#3B82F6' : '#F1F5F9', color: myToken && t.tokenNumber === myToken.tokenNumber ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', fontFamily: "'Nunito', sans-serif", flexShrink: 0 }}>
                  {t.displayToken || `#${t.tokenNumber}`}
                </div>
                <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                  {maskName(t.patientName)}
                  {myToken && t.tokenNumber === myToken.tokenNumber && <span style={{ color: '#3B82F6', fontWeight: '800' }}> (You)</span>}
                </div>
                <span className={`badge-${t.status}`} style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>
                  {t.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Refresh & clinic info */}
        <div style={{ padding: '14px 16px' }}>
          <button
            onClick={handleRefresh}
            style={{ width: '100%', background: '#fff', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '13px', color: '#0f172a', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {refreshing ? '⏳' : '↺'} Refresh
          </button>
        </div>

        <div style={{ height: '20px' }} />
      </div>

      <BottomNav />
    </div>
  );
};

export default HomeScreen;
