import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../shared/apiClient';
import { 
  Phone, Mail, Lock, Eye, EyeOff, LogIn, Crown, Store, 
  Scissors, Shirt, Truck, ShieldCheck, Clock, 
  BarChart3, User, AlertCircle, Loader2, UserPlus, 
  CheckCircle2, ArrowRight, Share2 
} from 'lucide-react';

const ROLES_LIST = [
  { id: 'SHOP', label: 'Shop Store Partner', icon: Store, desc: 'Retail store capturing bespoke orders' },
  { id: 'MASTER', label: 'Master Workshop', icon: Scissors, desc: 'Workshop intake, allocation & QC audit' },
  { id: 'TAILOR', label: 'Tailor Specialist', icon: Shirt, desc: 'Workstation crafting & milestone progress' },
  { id: 'DELIVERY_BOY', label: 'Logistics Fleet', icon: Truck, desc: 'Pickup collection & OTP delivery handover' },
];

const WORKFLOW_STEPS = [
  { label: 'SHOP', icon: Store },
  { label: 'WORKSHOP', icon: Scissors },
  { label: 'TAILOR', icon: Shirt },
  { label: 'QC', icon: ShieldCheck },
  { label: 'DELIVERY', icon: Truck },
];

export const Login = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Login Form Fields (Clean empty state)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Form Fields
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('SHOP');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-detect referral link in URL (?ref=SHP-1234 or ?referral=SHP-1234)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('referral');
    if (ref) {
      setRegReferralCode(ref.trim().toUpperCase());
      setAuthMode('register');
    }
  }, []);

  // Forgot Password / OTP Reset Flow
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP, 2: Verify OTP & New Password
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('/auth/forgot-password', {
        identifier: forgotIdentifier.trim()
      });
      setSuccessMsg(res.data?.message || 'Verification code sent to your registered contact.');
      setForgotStep(2);
    } catch (err) {
      setError(err?.message || 'Could not send verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword) {
      setError('Please enter the verification code and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const verifyRes = await apiClient.post('/auth/verify-otp', {
        identifier: forgotIdentifier.trim(),
        otp: otpCode.trim()
      });

      const token = verifyRes.data?.resetToken;
      if (!token) throw new Error('Verification failed');

      await apiClient.post('/auth/reset-password', {
        resetToken: token,
        newPassword
      });

      setSuccessMsg('Password updated successfully! Please sign in with your new credentials.');
      setAuthMode('login');
      setForgotStep(1);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await apiClient.post('/auth/login', {
        identifier: identifier.trim(),
        password
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
      setError(err?.message || 'Invalid credentials. Please check email/mobile and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regMobile || !regPassword) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await apiClient.post('/auth/register', {
        name: regName.trim(),
        mobile: regMobile.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword,
        role: regRole,
        shopName: regRole === 'SHOP' ? regBusinessName : undefined,
        workshopName: regRole === 'MASTER' ? regBusinessName : undefined,
        referralCode: regReferralCode.trim() ? regReferralCode.trim().toUpperCase() : undefined
      });

      if (response?.data?.accessToken) {
        loginUser(response.data);
        const role = response.data.user?.role;
        if (role === 'SUPER_ADMIN') navigate('/admin');
        else if (role === 'SHOP') navigate('/shop');
        else if (role === 'MASTER') navigate('/master');
        else if (role === 'TAILOR') navigate('/tailor');
        else if (role === 'DELIVERY_BOY') navigate('/delivery');
        else navigate('/');
      } else {
        setSuccessMsg(response?.data?.message || 'Registration submitted! Your account is pending Super Admin review. You can log in once approved.');
        setAuthMode('login');
        setRegName('');
        setRegMobile('');
        setRegEmail('');
        setRegPassword('');
        setRegBusinessName('');
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
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

        {/* 2. Right Column: Luxury Glass Card */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            background: 'rgba(16, 18, 24, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '20px',
            padding: '2.25rem 2rem',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px -10px rgba(212, 175, 55, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}>

            {/* Card Top Brand & Auth Mode Switcher */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src="/logo.png" 
                alt="Lord's Monogram" 
                style={{ width: '50px', height: '50px', objectFit: 'contain', marginBottom: '0.4rem', filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.4))' }} 
              />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                {authMode === 'login' ? 'Sign in' : 'Create Account'}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {authMode === 'login' ? 'Access your ERP workspace' : 'Register your partner role on Lord\'s ERP'}
              </p>
            </div>

            {/* Auth Mode Toggle Bar */}
            <div style={{
              display: 'flex',
              background: 'rgba(9, 10, 13, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '8px',
              padding: '3px'
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: authMode === 'login' ? 'linear-gradient(135deg, #e6c875 0%, #d4af37 100%)' : 'transparent',
                  color: authMode === 'login' ? '#161208' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: authMode === 'register' ? 'linear-gradient(135deg, #e6c875 0%, #d4af37 100%)' : 'transparent',
                  color: authMode === 'register' ? '#161208' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#86efac',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* A. SIGN IN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                
                {/* Email / Mobile Identifier */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.35rem' }}>
                    Email Address / Mobile Number
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={15} color="#d4af37" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      placeholder="Enter email or mobile number"
                      autoComplete="username"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                        background: 'rgba(10, 12, 16, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.35rem' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={15} color="#d4af37" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.3rem 0.65rem 2.3rem',
                        background: 'rgba(10, 12, 16, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none'
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
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span 
                    onClick={() => {
                      setAuthMode('forgot');
                      setError('');
                      setSuccessMsg('');
                      setForgotIdentifier(identifier);
                      setForgotStep(1);
                    }}
                    style={{ color: '#d4af37', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </span>
                </div>

                {/* Gold Satin Sign In Button */}
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
                    marginTop: '0.2rem'
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                </button>

              </form>
            )}

            {/* B. ROLE-BASED REGISTRATION FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                
                {/* Role Selector Grid */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#d4af37', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Select Operating Role *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {ROLES_LIST.map((r) => {
                      const IconComp = r.icon;
                      const isSelected = regRole === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setRegRole(r.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(10, 12, 16, 0.6)',
                            border: `1px solid ${isSelected ? '#d4af37' : 'rgba(255, 255, 255, 0.08)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <IconComp size={14} color={isSelected ? '#d4af37' : '#8492a6'} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isSelected ? '#ffffff' : '#94a3b8' }}>
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Full Name *</label>
                    <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Vikram Mehta" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Mobile Number *</label>
                    <input type="text" value={regMobile} onChange={(e) => setRegMobile(e.target.value)} required placeholder="9811223344" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }} />
                  </div>
                </div>

                {/* Email & Business Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Email Address</label>
                    <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="name@store.com" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Store/Atelier Name</label>
                    <input type="text" value={regBusinessName} onChange={(e) => setRegBusinessName(e.target.value)} placeholder="Savile Atelier" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }} />
                  </div>
                </div>

                {/* Password & Referral Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Password *</label>
                    <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required placeholder="Create secure password" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Referral / Partner Code</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Share2 size={13} color="#d4af37" style={{ position: 'absolute', left: '8px' }} />
                      <input 
                        type="text" 
                        value={regReferralCode} 
                        onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())} 
                        placeholder="e.g. SHP-1002 (Optional)" 
                        style={{ width: '100%', padding: '0.55rem 0.55rem 0.55rem 1.65rem', fontSize: '0.8rem', color: '#f3e5ab', fontWeight: 700, textTransform: 'uppercase' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Register Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #e6c875 0%, #d4af37 50%, #b8860b 100%)',
                    color: '#1a1608',
                    border: 'none',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                    marginTop: '0.25rem'
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                </button>

              </form>
            )}

            {/* C. FORGOT PASSWORD & OTP RESET FORM */}
            {authMode === 'forgot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3e5ab' }}>Reset Password</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {forgotStep === 1 
                      ? 'Enter your registered email or phone to receive a 6-digit verification OTP.' 
                      : `Enter the 6-digit OTP sent to your contact and your new password.`}
                  </p>
                </div>

                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.35rem' }}>
                        Registered Email / Mobile Number *
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Mail size={15} color="#d4af37" style={{ position: 'absolute', left: '12px' }} />
                        <input
                          type="text"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          required
                          placeholder="e.g. 9811223344 or admin@loeds.com"
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                            background: 'rgba(10, 12, 16, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

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
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                      }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                      <span 
                        onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                        style={{ color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        ← Back to Sign In
                      </span>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.35rem' }}>
                        6-Digit Verification OTP *
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(10, 12, 16, 0.7)',
                          border: '1px solid #d4af37',
                          borderRadius: '8px',
                          color: '#f3e5ab',
                          fontSize: '1.1rem',
                          letterSpacing: '0.2em',
                          textAlign: 'center',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.35rem' }}>
                        New Password *
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Min 6 characters"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(10, 12, 16, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.35rem' }}>
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(10, 12, 16, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

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
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                      }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      <span>{loading ? 'Resetting Password...' : 'Save New Password & Sign In'}</span>
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                      <span 
                        onClick={() => setForgotStep(1)}
                        style={{ color: '#d4af37', cursor: 'pointer' }}
                      >
                        ← Resend OTP
                      </span>
                      <span 
                        onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                        style={{ color: '#94a3b8', cursor: 'pointer' }}
                      >
                        Cancel & Back to Sign In
                      </span>
                    </div>
                  </form>
                )}
              </div>
            )}

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
