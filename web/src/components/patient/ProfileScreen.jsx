import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import BottomNav from '../shared/BottomNav';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      setEditMode(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    await logout();
    navigate('/', { replace: true });
  };

  const menuItems = [
    { icon: '👤', bg: '#EFF6FF', label: 'Personal Info', sub: 'Name, Phone', action: () => setEditMode(true) },
    { icon: '🔔', bg: '#FEF3C7', label: 'Notifications', sub: 'SMS, In-app alerts', action: () => toast('Notification settings coming soon') },
    { icon: '📅', bg: '#DCFCE7', label: 'My Appointments', sub: `${user?.totalVisits || 0} total visits`, action: () => navigate('/history'), badge: user?.totalVisits },
    { icon: '🌐', bg: '#F3E8FF', label: 'Language', sub: 'English · मराठी · हिंदी', action: () => toast('Language settings coming soon') },
    { icon: '📱', bg: '#EFF6FF', label: 'Get Android App', sub: 'Download APK for Android', action: () => toast('APK coming soon! 📱') },
    { icon: '🚪', bg: '#FEE2E2', label: 'Logout', sub: `Signed in as ${user?.name || 'Patient'}`, action: handleLogout, danger: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
      <div className="scroll-area" style={{ flex: 1 }}>
        {/* Profile header */}
        <div style={{ background: 'linear-gradient(160deg,#0F172A,#1e3a5f)', padding: '24px 20px 32px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '12px', fontFamily: "'Nunito', sans-serif" }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>{user?.name || 'Patient'}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>+91 {user?.phone} · Nashik</div>

          {/* Stats */}
          <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
            {[
              ['Total Visits', user?.totalVisits || 0, '#fff'],
              ['Completed', Math.max(0, (user?.totalVisits || 0) - 1), '#10B981'],
              ['Active', '#25', '#F59E0B'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color, fontFamily: "'Nunito', sans-serif" }}>{val}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit name modal */}
        {editMode && (
          <div style={{ margin: '16px', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Edit Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', border: '2px solid #3B82F6', borderRadius: '12px', padding: '12px', fontSize: '15px', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setEditMode(false)} style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, background: '#3B82F6', border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="card" style={{ margin: '16px', padding: 0, overflow: 'hidden' }}>
          {menuItems.map((item, i) => (
            <div
              key={item.label}
              onClick={item.action}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 18px', borderBottom: i < menuItems.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseOut={(e) => e.currentTarget.style.background = ''}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: item.danger ? '#EF4444' : '#0f172a' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{item.sub}</div>
              </div>
              {item.badge ? (
                <span style={{ background: '#3B82F6', color: '#fff', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>{item.badge}</span>
              ) : (
                <span style={{ color: item.danger ? '#EF4444' : '#C0CADC', fontSize: '16px' }}>›</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ height: '20px' }} />
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfileScreen;
