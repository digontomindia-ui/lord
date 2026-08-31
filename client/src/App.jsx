import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DeliveryDashboard from './pages/DeliveryDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopDashboard from './pages/ShopDashboard';
import MasterDashboard from './pages/MasterDashboard';
import TailorDashboard from './pages/TailorDashboard';

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

// Global Layout with Topbar
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {user && (
        <header style={{ padding: '0.85rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              LORD'S ERP
            </h2>
            <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              {user.role === 'SUPER_ADMIN' && <Link to="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Admin</Link>}
              {(user.role === 'SHOP' || user.role === 'SUPER_ADMIN') && <Link to="/shop" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Shop</Link>}
              {(user.role === 'MASTER' || user.role === 'SUPER_ADMIN') && <Link to="/master" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Workshop</Link>}
              {(user.role === 'TAILOR' || user.role === 'SUPER_ADMIN') && <Link to="/tailor" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Tailor</Link>}
              {(user.role === 'DELIVERY_BOY' || user.role === 'SUPER_ADMIN') && <Link to="/delivery" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Delivery</Link>}
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: 600, padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.12)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              {user.role}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.name}</span>
            <button onClick={logout} style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              Logout
            </button>
          </div>
        </header>
      )}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Router>
      <AppLayout>
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
            <Route path="/unauthorized" element={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--error)' }}><h3>Unauthorized Access</h3><p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>You do not have the required role permissions for this dashboard.</p></div>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </AppLayout>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
