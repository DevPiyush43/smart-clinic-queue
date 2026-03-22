import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useQueue from '../../hooks/useQueue';
import useSocket from '../../hooks/useSocket';
import QueueRow from '../shared/QueueRow';
import BottomNav from '../shared/BottomNav';
import { calcProgress, positionMessage, waitDisplay, maskName } from '../../utils/helpers';

const CLINIC_ID = import.meta.env.VITE_CLINIC_ID || '';

const QueueTracker = () => {
  const navigate = useNavigate();
  const { currentToken, queue, doneCount, queueLength, myToken, fetchMyToken, fetchLive, isLoading } = useQueue(CLINIC_ID);
  useSocket(CLINIC_ID);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchMyToken();
    fetchLive();
    // Fallback auto-refresh every 30s
    intervalRef.current = setInterval(() => fetchLive(), 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const progress = calcProgress(doneCount, queueLength);
  const myPosition = myToken ? (queue.findIndex((t) => t.tokenNumber === myToken.tokenNumber) + 1) : 0;
  const positionText = myToken
    ? positionMessage(myPosition > 0 ? myPosition - 1 : 0, (myPosition - 1) * 5)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Dark header */}
      <div style={{ background: '#0B1120', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 0' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <div className="live-badge">
            <div className="live-dot" />
            LIVE
          </div>
        </div>

        <div style={{ padding: '16px 18px 26px' }}>
          <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Now Serving</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '64px', fontWeight: '900', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {currentToken || '—'}
          </div>
          {myToken && (
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
              Your token: <strong style={{ color: '#60A5FA' }}>{myToken.displayToken || `#${myToken.tokenNumber}`}</strong>
              {' '}— <span>{positionText || 'Tracking...'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1 }}>
        {/* Progress bar */}
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Queue Progress</span>
            <strong style={{ fontSize: '12px', color: '#3B82F6' }}>{progress}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            <span>{doneCount} done</span>
            <span>{queueLength} remaining</span>
          </div>
        </div>

        {/* Queue list */}
        <div className="card" style={{ margin: '14px 16px 0' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Queue Status</div>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Queue is empty</div>
          ) : (
            queue.map((t, i) => (
              <QueueRow
                key={t._id || i}
                position={i + 1}
                patientName={maskName(t.patientName)}
                status={t.status}
                estimatedWait={t.estimatedWait}
                isMyToken={myToken && t.tokenNumber === myToken.tokenNumber}
              />
            ))
          )}
        </div>

        {/* Refresh button */}
        <div style={{ padding: '14px 16px 0' }}>
          <button
            onClick={() => fetchLive()}
            style={{ width: '100%', background: '#fff', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '14px', color: '#0f172a', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isLoading ? '⏳' : '↺'} Refresh Queue
          </button>
        </div>

        {/* Notification info pill */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1D4ED8', margin: '12px 16px 0' }}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          <span>Notifications enabled — you'll be alerted 2 patients before your turn</span>
        </div>

        {/* Estimated time card */}
        <div className="card" style={{ margin: '14px 16px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '32px' }}>⏱️</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Estimated Wait Time</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: '900', color: '#F59E0B' }}>
              {myToken ? waitDisplay((myPosition > 0 ? myPosition - 1 : queueLength) * 5) : waitDisplay(queueLength * 5)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Based on avg. 5 min per patient</div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default QueueTracker;
