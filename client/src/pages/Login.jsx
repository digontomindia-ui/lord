import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../shared/apiClient';
import { 
  Phone, Lock, Eye, EyeOff, LogIn, Crown, Store, 
  Scissors, Shirt, Truck, ShieldCheck, Clock, 
  BarChart3, UserCheck, AlertCircle, Loader2, 
  ArrowRight, CheckCircle2 
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', mobile: '9999999999', icon: Crown, fullWidth: true },
  { role: 'SHOP', label: 'Shop Owner', mobile: '9000000001', icon: Store },
  { role: 'MASTER', label: 'Master Workshop', mobile: '8000000001', icon: Scissors },
  { role: 'TAILOR', label: 'Tailor', mobile: '7000000001', icon: Shirt },
  { role: 'DELIVERY_BOY', label: 'Delivery Boy', mobile: '6000000001', icon: Truck },
];

const WORKFLOW_STEPS = [
  { label: 'SHOP', icon: Store },
  { label: 'WORKSHOP', icon: Scissors },
  { label: 'TAILOR', icon: Shirt },
  { label: 'QC', icon: ShieldCheck },
  { label: 'DELIVERY', icon: Truck },
];

export const Login = () => {
  const [mobile, setMobile] = useState('9999999999');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
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
        const role = response.data.user?.role;
        if (role === 'SUPER_ADMIN') navigate('/admin');
        else if (role === 'SHOP') navigate('/shop');
        else if (role === 'MASTER') navigate('/master');
        else if (role === 'TAILOR') navigate('/tailor');
        else if (role === 'DELIVERY_BOY') navigate('/delivery');
        else navigate('/');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#090a0d',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* Main Split Content Area */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        padding: '2rem 3rem',
        alignItems: 'center',
        gap: '3rem',
        minHeight: 'calc(100vh - 60px)'
      }} className="login-split-grid">

        {/* 1. Left Showcase: Bespoke Atelier Branding */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          position: 'relative'
        }} className="left-branding-showcase">
          
          {/* Subtle Ambient Gold Glow Background */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(0,0,0,0) 70%)',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* 3D Gold Logo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <img 
                src="/logo.png" 
                alt="Lord's Bespoke Logo" 
                style={{ 
                  width: '280px', 
                  maxHeight: '220px', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.35))'
                }} 
              />
            </div>

            {/* Typography Subtitle */}
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.35em',
              color: '#d4af37',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ height: '1px', width: '30px', background: 'linear-gradient(to right, transparent, #d4af37)' }} />
              ALTERATION ERP
              <span style={{ height: '1px', width: '30px', background: 'linear-gradient(to left, transparent, #d4af37)' }} />
            </div>

            <p style={{
              fontSize: '0.95rem',
              color: '#cbd5e1',
              maxWidth: '380px',
              lineHeight: 1.6,
              fontWeight: 400,
              marginBottom: '2.5rem'
            }}>
              Complete Alteration Business Management<br />
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>In One Integrated Platform</span>
            </p>

            {/* Horizontal Workflow Stepper Nodes */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '3rem',
              width: '100%',
              maxWidth: '480px'
            }}>
              {WORKFLOW_STEPS.map((step, idx) => {
                const IconComp = step.icon;
                return (
                  <React.Fragment key={step.label}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        border: '1px solid rgba(212, 175, 55, 0.45)',
                        background: 'rgba(212, 175, 55, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d4af37',
                        boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)',
                        transition: 'all 0.2s ease'
                      }}>
                        <IconComp size={18} />
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                        {step.label}
                      </span>
                    </div>

                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <span style={{ color: 'rgba(212, 175, 55, 0.4)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Bottom Value Badges */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '0.65rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
                <ShieldCheck size={14} color="#d4af37" />
                <span>Secure</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
                <Clock size={14} color="#d4af37" />
                <span>Real-time</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
                <BarChart3 size={14} color="#d4af37" />
                <span>Analytics Driven</span>
              </div>
            </div>

          </div>
        </div>

        {/* 2. Right Column: Luxury Glass Sign-in Card */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            background: 'rgba(16, 18, 24, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '20px',
            padding: '2.5rem 2.25rem',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px -10px rgba(212, 175, 55, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>

            {/* Card Header with Gold Mini-Emblem */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src="/logo.png" 
                alt="Lord's Monogram" 
                style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.4))' }} 
              />
              <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                Sign in
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Access your ERP workspace
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Mobile Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.4rem' }}>
                  Mobile Number
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={15} color="#d4af37" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    placeholder="9999999999"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                      background: 'rgba(10, 12, 16, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.4rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={15} color="#d4af37" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.65rem 2.3rem 0.65rem 2.3rem',
                      background: 'rgba(10, 12, 16, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.3rem' }}>
                <span 
                  onClick={() => alert('Please contact Super Admin to reset your password.')}
                  style={{ color: '#d4af37', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                >
                  Forgot Password?
                </span>
              </div>

              {/* Gold Satin Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #e6c875 0%, #d4af37 50%, #b8860b 100%)',
                  color: '#1a1608',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  marginTop: '0.25rem'
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </button>

            </form>

            {/* Divider OR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              margin: '0.25rem 0'
            }}>
              <span style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#94a3b8',
                padding: '0.15rem 0.5rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                OR
              </span>
              <span style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            {/* 3. Quick Demo Login Buttons */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#d4af37',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.65rem'
              }}>
                <UserCheck size={14} />
                <span>Quick Demo Login</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {DEMO_ACCOUNTS.map((acc) => {
                  const IconComp = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickDemoClick(acc.mobile)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: acc.fullWidth ? 'center' : 'flex-start',
                        gap: '0.45rem',
                        gridColumn: acc.fullWidth ? 'span 2' : 'auto',
                        transition: 'border-color 0.15s ease, background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }}
                    >
                      <IconComp size={14} color="#d4af37" />
                      <span>{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        fontSize: '0.75rem',
        color: '#64748b',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        © 2026 <strong style={{ color: '#d4af37' }}>LORD'S BESPOKE</strong> Alteration ERP. All rights reserved.
      </footer>

      {/* Responsive Inline Styles */}
      <style>{`
        @media (max-width: 960px) {
          .login-split-grid {
            grid-template-columns: 1fr !important;
            padding: 2rem 1.5rem !important;
            gap: 2rem !important;
          }
          .left-branding-showcase {
            padding: 1rem 0 !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Login;
