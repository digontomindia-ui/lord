import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopDashboard from './pages/ShopDashboard';
import MasterDashboard from './pages/MasterDashboard';
import TailorDashboard from './pages/TailorDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role?.toUpperCase();
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase().replace(/\s+/g, '_'));

  if (allowedRoles && !normalizedAllowed.includes(userRole) && userRole !== 'SUPER_ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes by Role */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>
            } />
            <Route path="/shop" element={
              <ProtectedRoute allowedRoles={['SHOP', 'SUPER_ADMIN']}><ShopDashboard /></ProtectedRoute>
            } />
            <Route path="/master" element={
              <ProtectedRoute allowedRoles={['MASTER', 'SUPER_ADMIN']}><MasterDashboard /></ProtectedRoute>
            } />
            <Route path="/tailor" element={
              <ProtectedRoute allowedRoles={['TAILOR', 'SUPER_ADMIN']}><TailorDashboard /></ProtectedRoute>
            } />
            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={['DELIVERY_BOY', 'SUPER_ADMIN']}><DeliveryDashboard /></ProtectedRoute>
            } />

            {/* Fallbacks */}
            <Route path="/unauthorized" element={
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--error)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Unauthorized Access</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  You do not have the required role permissions for this dashboard.
                </p>
              </div>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </AppShell>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
