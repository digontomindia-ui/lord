import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../shared/apiClient';
import { ShieldCheck, LogIn, Sparkles, AlertCircle, Loader2, User, Store, Scissors, Truck, Shield } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', mobile: '9999999999', path: '/admin', icon: Shield },
  { role: 'SHOP', label: 'Shop Owner', mobile: '9000000001', path: '/shop', icon: Store },
  { role: 'MASTER', label: 'Master Workshop', mobile: '8000000001', path: '/master', icon: Scissors },
  { role: 'TAILOR', label: 'Tailor', mobile: '7000000001', path: '/tailor', icon: Scissors },
  { role: 'DELIVERY_BOY', label: 'Delivery Boy', mobile: '6000000001', path: '/delivery', icon: Truck },
];

export const Login = () => {
  const [mobile, setMobile] = useState('9999999999');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const performLogin = async (loginMobile, loginPassword) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/login', {
        mobile: loginMobile.trim(),
        password: loginPassword
      });

      if (response?.data) {
        loginUser(response.data);
        const role = response.data.user.role;
        if (role === 'SUPER_ADMIN') navigate('/admin');
        else if (role === 'SHOP') navigate('/shop');
        else if (role === 'MASTER') navigate('/master');
        else if (role === 'TAILOR') navigate('/tailor');
        else if (role === 'DELIVERY_BOY') navigate('/delivery');
        else navigate('/');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performLogin(mobile, password);
  };

  const handleQuickDemoClick = (demoMobile) => {
    setMobile(demoMobile);
    setPassword('password123');
    performLogin(demoMobile, 'password123');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-canvas)' }}>
      <div 
        className="erp-card"
        style={{ padding: '2rem', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.6rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
            <ShieldCheck size={32} color="var(--accent-primary)" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            LORD'S BESPOKE
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
            Enterprise Alteration Platform
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.6rem 0.85rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#f87171', fontSize: '0.8rem' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Mobile Number
            </label>
            <input 
              type="text" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9999999999"
              required
              style={{ width: '100%', padding: '0.65rem 0.85rem' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '0.65rem 0.85rem' }} 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.7rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8125rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.25rem' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} 
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Demo Access:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const IconComp = acc.icon;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemoClick(acc.mobile)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    textAlign: 'left',
                    gridColumn: acc.role === 'SUPER_ADMIN' ? 'span 2' : 'auto'
                  }}
                >
                  <IconComp size={13} color="var(--accent-light)" />
                  <span>{acc.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
