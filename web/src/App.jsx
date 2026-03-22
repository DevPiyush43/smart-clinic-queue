import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './store/authStore';

// Screens
import WelcomeScreen   from './components/patient/WelcomeScreen';
import LoginScreen     from './components/patient/LoginScreen';
import OtpScreen       from './components/patient/OtpScreen';
import HomeScreen      from './components/patient/HomeScreen';
import BookingScreen   from './components/patient/BookingScreen';
import QueueTracker    from './components/patient/QueueTracker';
import HistoryScreen   from './components/patient/HistoryScreen';
import ProfileScreen   from './components/patient/ProfileScreen';
import DoctorLogin     from './components/doctor/DoctorLogin';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import ProtectedRoute  from './components/shared/ProtectedRoute';
import LoadingSpinner  from './components/shared/LoadingSpinner';

// Offline banner hook
const useOnline = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up   = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
};

const App = () => {
  const { loadFromStorage, isLoading, isAuthenticated, user } = useAuthStore();
  const isOnline = useOnline();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <BrowserRouter>
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          📵 You're offline — showing last known data
        </div>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      {/* Patient shell wrapper */}
      <div className="patient-shell">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public */}
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/verify" element={<OtpScreen />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />

            {/* Patient routes */}
            <Route path="/home"     element={<ProtectedRoute requiredRole="patient"><HomeScreen /></ProtectedRoute>} />
            <Route path="/booking"  element={<ProtectedRoute requiredRole="patient"><BookingScreen /></ProtectedRoute>} />
            <Route path="/tracker"  element={<ProtectedRoute requiredRole="patient"><QueueTracker /></ProtectedRoute>} />
            <Route path="/history"  element={<ProtectedRoute requiredRole="patient"><HistoryScreen /></ProtectedRoute>} />
            <Route path="/profile"  element={<ProtectedRoute requiredRole="patient"><ProfileScreen /></ProtectedRoute>} />

            {/* Doctor routes (no patient shell) */}
            <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />

            {/* Fallback */}
            <Route
              path="*"
              element={
                isAuthenticated
                  ? <Navigate to={user?.role === 'doctor' ? '/doctor' : '/home'} replace />
                  : <Navigate to="/" replace />
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
};

export default App;
