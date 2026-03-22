import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/home', icon: '🏠', label: 'Home' },
  { path: '/booking', icon: '📋', label: 'Book' },
  { path: '/tracker', icon: '📡', label: 'Track' },
  { path: '/history', icon: '📅', label: 'History' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      height: '70px',
      background: '#fff',
      borderTop: '1px solid #F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px',
      flexShrink: 0,
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <div
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: '12px',
              background: isActive ? '#EFF6FF' : 'transparent',
              transition: 'background 0.15s',
              minWidth: '56px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: isActive ? '#3B82F6' : '#94a3b8',
            }}>
              {tab.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
