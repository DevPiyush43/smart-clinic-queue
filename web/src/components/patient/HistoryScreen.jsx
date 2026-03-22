import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import BottomNav from '../shared/BottomNav';
import { formatDate, formatTime, statusClass, statusLabel } from '../../utils/helpers';

const HistoryScreen = () => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/token/history?page=${p}&limit=10`);
      if (p === 1) {
        setTokens(res.data.tokens);
      } else {
        setTokens((prev) => [...prev, ...res.data.tokens]);
      }
      setHasMore(res.data.pagination.hasMore);
      setPage(p);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const tokenColors = {
    waiting: { bg: '#FEF3C7', color: '#D97706' },
    next: { bg: '#DBEAFE', color: '#1D4ED8' },
    serving: { bg: '#3B82F6', color: '#fff' },
    done: { bg: '#DCFCE7', color: '#15803D' },
    skipped: { bg: '#FCE7F3', color: '#9D174D' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F8FAFC' }}>
        <button onClick={() => navigate('/home')} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <span style={{ fontSize: '17px', fontWeight: '700' }}>Visit History</span>
      </div>

      <div className="scroll-area" style={{ flex: 1 }}>
        {tokens.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>No visits yet</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Your appointment history will appear here</div>
          </div>
        ) : (
          <>
            <div style={{ paddingTop: '8px' }}>
              {tokens.map((t) => {
                const colors = tokenColors[t.status] || tokenColors.cancelled;
                return (
                  <div
                    key={t._id}
                    onClick={() => navigate('/booking')}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseOut={(e) => e.currentTarget.style.background = ''}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: colors.bg, color: colors.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif", fontSize: '17px', fontWeight: '900', flexShrink: 0 }}>
                      {t.displayToken || `#${t.tokenNumber}`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.clinic?.name || 'Clinic'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {formatDate(t.bookedAt)} · {formatTime(t.bookedAt)}
                      </div>
                    </div>
                    <span style={{ ...colors, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', flexShrink: 0 }}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', padding: '16px' }}>
              {loading ? (
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</span>
              ) : hasMore ? (
                <button
                  onClick={() => fetchHistory(page + 1)}
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '10px 20px', color: '#1D4ED8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Load More
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Showing all {tokens.length} visits</span>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default HistoryScreen;
