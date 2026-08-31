import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, ShoppingBag, Scissors, Truck, Users, 
  Wallet, Settings, LogOut, Bell, Menu, X, Shield, Tag, 
  FileText, CheckSquare, Sparkles 
} from 'lucide-react';

const MENU_CONFIG = {
  SUPER_ADMIN: [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Stores Network', path: '/shop', icon: ShoppingBag },
    { label: 'Master Workshop', path: '/master', icon: Scissors },
    { label: 'Tailor Stations', path: '/tailor', icon: Users },
    { label: 'Delivery Fleet', path: '/delivery', icon: Truck },
  ],
  SHOP: [
    { label: 'Shop Hub', path: '/shop', icon: LayoutDashboard },
  ],
  MASTER: [
    { label: 'Craft Workshop', path: '/master', icon: Scissors },
  ],
  TAILOR: [
    { label: 'Tailor Desk', path: '/tailor', icon: Scissors },
  ],
  DELIVERY_BOY: [
    { label: 'Logistics Fleet', path: '/delivery', icon: Truck },
  ]
};

export const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return children;

  const role = user.role?.toUpperCase() || 'SHOP';
  const menuItems = MENU_CONFIG[role] || MENU_CONFIG.SHOP;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {/* Topbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand & Left Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: 'white', padding: '0.25rem' }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <Scissors size={18} color="var(--accent-color)" />
            </div>
            <div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                LORD'S BESPOKE
              </span>
              <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '-2px' }}>
                Alteration ERP
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }} className="desktop-nav">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Status & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            padding: '0.25rem 0.65rem',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent-light)',
            letterSpacing: '0.02em'
          }}>
            {role}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>
              {user.name?.[0] || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }} className="desktop-user-info">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user.mobile}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={14} />
            <span className="desktop-logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {children}
      </main>

      {/* Responsive Styles Injection */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-user-info { display: none !important; }
          .desktop-logout-text { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default AppShell;
