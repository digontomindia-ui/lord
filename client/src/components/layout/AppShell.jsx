import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, ShoppingBag, Scissors, Truck, Users, 
  Wallet, Settings, LogOut, Bell, Menu, X, Tag, FileText, 
  Search, ChevronRight, ShieldCheck, Activity, Layers, 
  AlertCircle, ChevronDown, Crown, Store, Shirt 
} from 'lucide-react';

const NAVIGATION_SECTIONS = [
  {
    title: 'Core',
    roles: ['SUPER_ADMIN', 'SHOP', 'MASTER', 'TAILOR', 'DELIVERY_BOY'],
    items: [
      { label: 'Overview', path: '/admin', roles: ['SUPER_ADMIN'], icon: LayoutDashboard },
      { label: 'Shop Hub', path: '/shop', roles: ['SHOP', 'SUPER_ADMIN'], icon: Store },
      { label: 'Master Workshop', path: '/master', roles: ['MASTER', 'SUPER_ADMIN'], icon: Scissors },
      { label: 'Tailor Workspace', path: '/tailor', roles: ['TAILOR', 'SUPER_ADMIN'], icon: Shirt },
      { label: 'Logistics Fleet', path: '/delivery', roles: ['DELIVERY_BOY', 'SUPER_ADMIN'], icon: Truck },
    ]
  },
  {
    title: 'Operations',
    roles: ['SUPER_ADMIN', 'SHOP'],
    items: [
      { label: 'All Orders', path: '/shop', roles: ['SHOP', 'SUPER_ADMIN'], icon: FileText, badge: 'Live' },
      { label: 'Workshop Queue', path: '/master', roles: ['MASTER', 'SUPER_ADMIN'], icon: Layers },
      { label: 'Fleet Deliveries', path: '/delivery', roles: ['DELIVERY_BOY', 'SUPER_ADMIN'], icon: Truck },
    ]
  },
  {
    title: 'Finance & Network',
    roles: ['SUPER_ADMIN', 'SHOP'],
    items: [
      { label: '6-Bucket Wallets', path: '/shop', roles: ['SHOP', 'SUPER_ADMIN'], icon: Wallet },
      { label: 'Price Master', path: '/admin', roles: ['SUPER_ADMIN'], icon: Tag },
    ]
  }
];

export const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return children;

  const role = user.role?.toUpperCase() || 'SHOP';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageBreadcrumb = () => {
    if (location.pathname.startsWith('/admin')) return 'Dashboard / Overview';
    if (location.pathname.startsWith('/shop')) return 'Store / Orders & POS';
    if (location.pathname.startsWith('/master')) return 'Workshop / Production & QC';
    if (location.pathname.startsWith('/tailor')) return 'Tailor / Workstation';
    if (location.pathname.startsWith('/delivery')) return 'Fleet / Logistics';
    return 'Dashboard';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      
      {/* 1. Left Enterprise Sidebar (Desktop) */}
      <aside style={{
        width: sidebarCollapsed ? '64px' : '230px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-gold)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        transition: 'width 0.2s ease',
        flexShrink: 0
      }} className="desktop-sidebar">
        
        {/* Brand Header with 3D Gold Logo */}
        <div style={{
          padding: sidebarCollapsed ? '0.75rem 0.5rem' : '0.85rem 1.1rem',
          borderBottom: '1px solid var(--border-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          gap: '0.65rem',
          height: '62px',
          background: 'rgba(0, 0, 0, 0.25)'
        }}>
          <img 
            src="/logo.png" 
            alt="Lord's Logo" 
            style={{ 
              width: sidebarCollapsed ? '32px' : '36px', 
              height: sidebarCollapsed ? '32px' : '36px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.35))',
              flexShrink: 0
            }} 
          />
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em', lineHeight: 1.1 }}>
                LORD'S BESPOKE
              </span>
              <span style={{ fontSize: '0.625rem', color: '#d4af37', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Alteration ERP
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Navigation Items */}
        <div style={{ flex: 1, padding: '0.85rem 0.6rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {NAVIGATION_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(item => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {!sidebarCollapsed && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8492a6', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.6rem 0.4rem 0.6rem' }}>
                    {section.title}
                  </div>
                )}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {visibleItems.map((item) => {
                    const IconComp = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.label + item.path}
                        to={item.path}
                        title={item.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: isActive ? 600 : 500,
                          textDecoration: 'none',
                          color: isActive ? '#f3e5ab' : 'var(--text-secondary)',
                          background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                          border: `1px solid ${isActive ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`,
                          boxShadow: isActive ? '0 0 12px rgba(212, 175, 55, 0.12)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <IconComp size={16} color={isActive ? '#d4af37' : 'var(--text-muted)'} />
                        {!sidebarCollapsed && (
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{item.label}</span>
                            {item.badge && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 700 }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer User Info */}
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--border-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', flexShrink: 0 }}>
                {user.name?.[0] || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#d4af37', fontWeight: 600 }}>
                  {user.role}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#d4af37' }}>
              {user.name?.[0] || 'U'}
            </div>
          )}

          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.35rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Topbar */}
        <header style={{
          height: '62px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-gold)',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          {/* Breadcrumb / Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setMobileDrawerOpen(true)}
              style={{ display: 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.2rem' }}
              className="mobile-hamburger-btn"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lord's ERP</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: '#d4af37', fontWeight: 600 }}>{getPageBreadcrumb()}</span>
            </div>
          </div>

          {/* Global Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', width: '320px', position: 'relative' }} className="desktop-search-bar">
            <Search size={14} color="#d4af37" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, clients, tickets... (Ctrl+K)"
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem 0.4rem 2rem',
                fontSize: '0.78rem',
                background: 'rgba(9, 10, 13, 0.7)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Actions & Gold Role Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(212, 175, 55, 0.12)',
              color: '#f3e5ab',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              letterSpacing: '0.04em'
            }}>
              {role}
            </span>

            <button
              onClick={() => alert('All systems operational (0 unread notifications)')}
              style={{ background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--text-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Notifications"
            >
              <Bell size={15} color="#d4af37" />
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '0.35rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              <span>Exit</span>
            </button>
          </div>
        </header>

        {/* 3. Main Dashboard Body */}
        <main style={{ flex: 1, padding: '1.25rem 1.5rem 3rem 1.5rem', minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)' }} onClick={() => setMobileDrawerOpen(false)} />
          <div style={{ position: 'relative', width: '260px', background: 'var(--bg-surface)', height: '100%', zIndex: 101, display: 'flex', flexDirection: 'column', padding: '1rem', borderRight: '1px solid var(--border-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>LORD'S ERP</span>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setMobileDrawerOpen(false)} />
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {NAVIGATION_SECTIONS.flatMap(s => s.items).filter(i => i.roles.includes(role)).map((item) => {
                const IconComp = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      color: isActive ? '#f3e5ab' : 'var(--text-secondary)',
                      border: `1px solid ${isActive ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`
                    }}
                  >
                    <IconComp size={18} color={isActive ? '#d4af37' : '#8492a6'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Responsive Inline Media Queries */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-sidebar { display: none !important; }
          .mobile-hamburger-btn { display: block !important; }
          .desktop-search-bar { display: none !important; }
        }
      `}</style>

    </div>
  );
};

export default AppShell;
