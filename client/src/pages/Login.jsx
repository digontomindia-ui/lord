import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../shared/apiClient';
import { ShieldCheck, LogIn, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'SUPER_ADMIN', label: '👑 Super Admin', mobile: '9999999999', path: '/admin' },
  { role: 'SHOP', label: '🏬 Shop Owner', mobile: '9000000001', path: '/shop' },
  { role: 'MASTER', label: '✂️ Master Workshop', mobile: '8000000001', path: '/master' },
  { role: 'TAILOR', label: '🧵 Tailor', mobile: '7000000001', path: '/tailor' },
  { role: 'DELIVERY_BOY', label: '🛵 Delivery Boy', mobile: '6000000001', path: '/delivery' },
];

const Login = () => {
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
      setError(err?.message || 'Login failed. Please check credentials or seed demo database.');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ padding: '2.5rem', maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <ShieldCheck size={40} color="var(--accent-color)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em' }}>LORD'S BESPOKE</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Alteration ERP System</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#fca5a5', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Mobile Number
            </label>
            <input 
              type="text" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9999999999"
              required
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white', outline: 'none' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white', outline: 'none' }} 
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.875rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', boxShadow: 'var(--shadow-glow)' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} 
            {loading ? 'Authenticating...' : 'Sign In to ERP'}
          </motion.button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Sparkles size={16} /> 1-Click Quick Demo Login:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickDemoClick(acc.mobile)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  gridColumn: acc.role === 'SUPER_ADMIN' ? 'span 2' : 'auto'
                }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
