import React from 'react';

const StatBox = ({ value, label, color = '#3B82F6' }) => (
  <div style={{
    flex: 1,
    background: '#fff',
    borderRadius: '16px',
    padding: '14px 10px',
    border: '1px solid #E2E8F0',
    textAlign: 'center',
  }}>
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      fontSize: '26px',
      fontWeight: '900',
      color,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '10px',
      color: '#64748b',
      fontWeight: '600',
      marginTop: '4px',
    }}>
      {label}
    </div>
  </div>
);

export default StatBox;
