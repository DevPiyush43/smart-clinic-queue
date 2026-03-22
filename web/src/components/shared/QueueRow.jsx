import React from 'react';
import { statusClass, statusLabel } from '../../utils/helpers';

const QueueRow = ({ position, patientName, status, estimatedWait, isMyToken = false }) => {
  const posColors = {
    1: { bg: '#EFF6FF', color: '#1D4ED8' },
    2: { bg: '#F0FDF4', color: '#15803D' },
    3: { bg: '#FEF3C7', color: '#D97706' },
  };
  const posStyle = posColors[position] || { bg: '#F3F4F6', color: '#6B7280' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 0',
      borderBottom: '1px solid #F8FAFC',
      background: isMyToken ? 'rgba(59,130,246,0.04)' : 'transparent',
      borderRadius: isMyToken ? '10px' : '0',
    }}>
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: isMyToken ? '#3B82F6' : posStyle.bg,
        color: isMyToken ? '#fff' : posStyle.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
        fontSize: '15px',
        fontWeight: '900',
        flexShrink: 0,
      }}>
        {position}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: isMyToken ? '700' : '600',
          color: isMyToken ? '#1D4ED8' : '#0f172a',
        }}>
          {patientName} {isMyToken ? '(You)' : ''}
        </div>
        {estimatedWait > 0 && (
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
            ~{estimatedWait} min
          </div>
        )}
      </div>
      <span className={statusClass(status)} style={{
        fontSize: '11px',
        fontWeight: '700',
        padding: '3px 10px',
        borderRadius: '20px',
      }}>
        {statusLabel(status)}
      </span>
    </div>
  );
};

export default QueueRow;
