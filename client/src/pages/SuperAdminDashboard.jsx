import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { orderService, adminService } from '../services/apiServices';
import StatusBadge from '../components/ui/StatusBadge';
import { 
  TrendingUp, Clock, RefreshCw, Download, AlertTriangle, 
  CheckCircle2, ChevronRight, Layers, DollarSign, Store, 
  Users, Activity, Tag, ShieldCheck, Crown, Scissors, Shirt, Truck, Package, 
  UserCheck, UserX, Check, X, AlertCircle, PlusCircle, Edit, Trash2, ArrowRight 
} from 'lucide-react';

const WORKFLOW_NODES = [
  { key: 'CREATED', label: 'Created', icon: Store },
  { key: 'PICKUP', label: 'Pickup', icon: Truck },
  { key: 'WORKSHOP', label: 'Workshop', icon: Scissors },
  { key: 'TAILOR', label: 'Tailor', icon: Shirt },
  { key: 'QC', label: 'QC Audit', icon: ShieldCheck },
  { key: 'READY', label: 'Ready', icon: CheckCircle2 },
  { key: 'DELIVERY', label: 'Delivery', icon: Truck },
  { key: 'CLOSED', label: 'Closed', icon: Package }
];

const GARMENT_TYPES = ['SHIRT', 'PANT', 'SUIT', 'BLAZER', 'SHERWANI', 'LADIES_WEAR', 'REPAIR'];

export const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [prices, setPrices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Price Master Modal State
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [garmentType, setGarmentType] = useState('SHIRT');
  const [alterationType, setAlterationType] = useState('');
  const [normalPrice, setNormalPrice] = useState(150);
  const [urgentPrice, setUrgentPrice] = useState(225);
  const [veryUrgentPrice, setVeryUrgentPrice] = useState(300);
  const [vipPrice, setVipPrice] = useState(375);
  const [festivalPrice, setFestivalPrice] = useState(250);
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, priceRes, auditRes, pendingRes] = await Promise.all([
        apiClient.get('/dashboards/admin').catch(() => ({ data: {} })),
        orderService.getOrders().catch(() => ({ data: [] })),
        adminService.getPrices().catch(() => ({ data: [] })),
        adminService.getAuditLogs({ limit: 8 }).catch(() => ({ data: [] })),
        adminService.getPendingUsers().catch(() => ({ data: [] }))
      ]);

      setMetrics(dashRes?.data || {});
      setOrders(ordersRes?.data || []);
      setPrices(priceRes?.data || []);
      setAuditLogs(auditRes?.data || []);
      setPendingUsers(pendingRes?.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprovePartner = async (userId, name) => {
    try {
      await adminService.approveUser(userId);
      setActionFeedback({ type: 'success', message: `Partner account for ${name} APPROVED and activated!` });
      fetchDashboardData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to approve partner' });
    }
  };

  const handleRejectPartner = async (userId, name) => {
    try {
      await adminService.rejectUser(userId, 'Rejected by Super Admin');
      setActionFeedback({ type: 'success', message: `Registration for ${name} rejected.` });
      fetchDashboardData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to reject partner' });
    }
  };

  // Price Modal Handlers
  const handleNormalPriceChange = (val) => {
    const num = Number(val) || 0;
    setNormalPrice(num);
    setUrgentPrice(Math.round(num * 1.5));
    setVeryUrgentPrice(Math.round(num * 2.0));
    setVipPrice(Math.round(num * 2.5));
    setFestivalPrice(Math.round(num * 1.75));
  };

  const openNewPriceModal = () => {
    setEditingPriceId(null);
    setGarmentType('SHIRT');
    setAlterationType('');
    handleNormalPriceChange(150);
    setPriceModalOpen(true);
  };

  const openEditPriceModal = (p) => {
    setEditingPriceId(p._id);
    setGarmentType(p.garmentType);
    setAlterationType(p.alterationType);
    setNormalPrice(p.normalPrice);
    setUrgentPrice(p.urgentPrice);
    setVeryUrgentPrice(p.veryUrgentPrice);
    setVipPrice(p.vipPrice);
    setFestivalPrice(p.festivalPrice);
    setPriceModalOpen(true);
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      const payload = {
        garmentType,
        alterationType,
        normalPrice: Number(normalPrice),
        urgentPrice: Number(urgentPrice),
        veryUrgentPrice: Number(veryUrgentPrice),
        vipPrice: Number(vipPrice),
        festivalPrice: Number(festivalPrice)
      };

      if (editingPriceId) {
        await adminService.updatePrice(editingPriceId, payload);
        setActionFeedback({ type: 'success', message: `Price rule for ${garmentType} - ${alterationType} updated successfully!` });
      } else {
        await adminService.savePrice(payload);
        setActionFeedback({ type: 'success', message: `New price rule for ${garmentType} - ${alterationType} created successfully!` });
      }

      setPriceModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to save price rule' });
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDeletePrice = async (priceId, name) => {
    if (!window.confirm(`Are you sure you want to delete price rule for "${name}"?`)) return;
    try {
      await adminService.deletePrice(priceId);
      setActionFeedback({ type: 'success', message: `Price rule for "${name}" deleted.` });
      fetchDashboardData();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to delete price rule' });
    }
  };

  // Compute Pipeline Stage Counts from Real Orders
  const getStageCount = (key) => {
    if (key === 'CREATED') return orders.filter(o => o.status === 'ORDER_CREATED').length;
    if (key === 'PICKUP') return orders.filter(o => o.status.includes('PICKUP') || o.status === 'PICKED_UP').length;
    if (key === 'WORKSHOP') return orders.filter(o => o.status.includes('WORKSHOP') || o.status.includes('INSPECTION')).length;
    if (key === 'TAILOR') return orders.filter(o => o.status.includes('TAILOR') || o.status.includes('WORK_')).length;
    if (key === 'QC') return orders.filter(o => o.status.includes('QC') || o.status === 'REWORK_REQUIRED').length;
    if (key === 'READY') return orders.filter(o => o.status === 'READY_FOR_DELIVERY').length;
    if (key === 'DELIVERY') return orders.filter(o => o.status.includes('DELIVERY') || o.status === 'DELIVERED_TO_SHOP').length;
    if (key === 'CLOSED') return orders.filter(o => o.status === 'ORDER_CLOSED').length;
    return 0;
  };

  // Needs Attention Counts
  const delayedCount = orders.filter(o => o.isDelayed).length;
  const qcFailedCount = orders.filter(o => o.status === 'QC_FAILED' || o.status === 'REWORK_REQUIRED').length;
  const pendingPickupCount = orders.filter(o => o.status === 'PICKUP_REQUESTED').length;
  const pendingDeliveryCount = orders.filter(o => o.status === 'READY_FOR_DELIVERY' || o.status === 'DELIVERY_ASSIGNED').length;

  const filteredOrders = statusFilter === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Overview</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', color: '#d4af37', fontWeight: 600 }}>
              Live Operations
            </span>
          </h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Real-time enterprise atelier operations, partner governance, and dynamic price master
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            {['7D', '30D', '90D', '1Y'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                style={{
                  background: timeRange === t ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  color: timeRange === t ? '#f3e5ab' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#d4af37" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => alert('Exporting atelier operational metrics report (CSV)...')}
            className="btn-gold"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: actionFeedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8125rem'
        }}>
          <span>{actionFeedback.message}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setActionFeedback(null)} />
        </div>
      )}

      {/* 2. Compact KPI Row with Luxury Gold Styling */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        
        {/* KPI 1: Revenue */}
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue</span>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>Settled</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            ₹{(metrics?.revenue?.total || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Today: ₹{(metrics?.revenue?.today || 0).toLocaleString()}
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>All Time</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {metrics?.orders?.today || 0} placed today
          </div>
        </div>

        {/* KPI 3: Active Orders */}
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active In-Work</span>
            <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}>
              {orders.filter(o => o.priority === 'URGENT' || o.priority === 'VERY_URGENT').length} urgent
            </span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {orders.filter(o => o.status !== 'ORDER_CLOSED' && o.status !== 'CANCELLED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            In workshop & transit
          </div>
        </div>

        {/* KPI 4: Completed Orders */}
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</span>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>100% Quality</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {orders.filter(o => o.status === 'ORDER_CLOSED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Delivered to client
          </div>
        </div>

        {/* KPI 5: Active Stores */}
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stores</span>
            <span style={{ fontSize: '0.68rem', color: '#f3e5ab', fontWeight: 700 }}>Active</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {metrics?.users?.shops || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Retail partner POS
          </div>
        </div>

        {/* KPI 6: Tailors & Fleet */}
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tailors & Fleet</span>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>Online</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {(metrics?.users?.tailors || 0) + (metrics?.users?.deliveryBoys || 0)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {metrics?.users?.tailors || 0} tailors • {metrics?.users?.deliveryBoys || 0} fleet
          </div>
        </div>

      </div>

      {/* 3. PENDING PARTNER REGISTRATIONS APPROVAL CENTER */}
      {pendingUsers.length > 0 && (
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} color="#f59e0b" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Partner Approvals ({pendingUsers.length})
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>
              New applicants waiting for Super Admin authorization
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Requested Role</th>
                  <th>Mobile Number</th>
                  <th>Email</th>
                  <th>Registered On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pUser) => (
                  <tr key={pUser._id}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>{pUser.name}</td>
                    <td>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '3px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#f3e5ab', fontWeight: 700 }}>
                        {pUser.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{pUser.mobile}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{pUser.email || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(pUser.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleApprovePartner(pUser._id, pUser.name)}
                          style={{
                            background: '#10b981',
                            color: '#06281e',
                            border: 'none',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectPartner(pUser._id, pUser.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Horizontal Gold Workflow Order Pipeline */}
      <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Order Pipeline
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Real-time stage allocation ({orders.length} total)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '0.65rem', overflowX: 'auto' }}>
          {WORKFLOW_NODES.map((stage, idx) => {
            const count = getStageCount(stage.key);
            const IconComp = stage.icon;
            return (
              <div
                key={stage.key}
                style={{
                  background: 'rgba(16, 19, 26, 0.75)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <IconComp size={14} color="#d4af37" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {stage.label}
                    </span>
                  </div>
                  {idx < WORKFLOW_NODES.length - 1 && (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(212, 175, 55, 0.4)' }}>→</span>
                  )}
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: count > 0 ? '#f8fafc' : 'var(--text-muted)' }}>
                  {count}
                </div>
                <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                  <div style={{
                    width: `${orders.length > 0 ? (count / orders.length) * 100 : 0}%`,
                    height: '100%',
                    background: count > 0 ? 'var(--gold-gradient)' : 'transparent',
                    borderRadius: '2px'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Actionable Operations & Recent Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-split">
        
        {/* Needs Attention */}
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Needs Attention
            </span>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
              {delayedCount + qcFailedCount + pendingPickupCount + pendingDeliveryCount} Action Items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            
            <div 
              onClick={() => setStatusFilter('REWORK_REQUIRED')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} color="#f87171" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5' }}>QC Failed / Rework</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f87171' }}>{qcFailedCount}</span>
                <ChevronRight size={14} color="#fca5a5" />
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('PICKUP_REQUESTED')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={15} color="#fbbf24" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fde68a' }}>Pending Shop Pickup</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>{pendingPickupCount}</span>
                <ChevronRight size={14} color="#fde68a" />
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('READY_FOR_DELIVERY')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#bae6fd' }}>Ready for Delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>{pendingDeliveryCount}</span>
                <ChevronRight size={14} color="#bae6fd" />
              </div>
            </div>

            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Delayed Orders</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{delayedCount}</span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            </div>

          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Recent Activity
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Non-repudiation audit
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, overflowY: 'auto', maxHeight: '190px' }}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                System operational. No unverified audit events.
              </div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={log._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
                  <div>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{log.action}</span>
                    <span style={{ color: '#d4af37', marginLeft: '0.4rem', fontSize: '0.72rem' }}>• {log.role}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 6. Recent Orders Real Enterprise Table */}
      <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Recent Orders
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              ({filteredOrders.length} records)
            </span>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['ALL', 'ORDER_CREATED', 'PICKUP_REQUESTED', 'READY_FOR_DELIVERY', 'ORDER_CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${statusFilter === st ? 'rgba(212, 175, 55, 0.45)' : 'var(--border-subtle)'}`,
                  color: statusFilter === st ? '#f3e5ab' : 'var(--text-secondary)',
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No orders found matching the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Garment</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 8).map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 700, color: '#d4af37' }}>
                      {order.orderNumber}
                    </td>
                    <td>{order.customerId?.name || 'Customer'}</td>
                    <td>
                      {order.items?.[0]?.garmentType || 'Garment'}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: '0.25rem' }}>
                        ({order.items?.[0]?.alterations?.type || 'Alteration'})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '3px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#f3e5ab', fontWeight: 600 }}>
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>
                      ₹{order.pricing?.total || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. DYNAMIC LIVE EDITABLE PRICE MASTER MATRIX TABLE */}
      <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Dynamic Price Master Matrix ({prices.length} Rules)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              Live configurable alteration rates
            </span>
          </div>
          <button
            onClick={openNewPriceModal}
            className="btn-gold"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <PlusCircle size={14} />
            <span>Add Price Rule</span>
          </button>
        </div>

        {prices.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No price rules configured. Click <strong>"Add Price Rule"</strong> to create one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Garment</th>
                  <th>Alteration Type</th>
                  <th>Normal (1.0x)</th>
                  <th>Urgent (1.5x)</th>
                  <th>Very Urgent (2.0x)</th>
                  <th>VIP (2.5x)</th>
                  <th>Festival</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>{p.garmentType}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.alterationType}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{p.normalPrice}</td>
                    <td style={{ color: '#f3e5ab' }}>₹{p.urgentPrice}</td>
                    <td style={{ color: '#f3e5ab' }}>₹{p.veryUrgentPrice}</td>
                    <td style={{ color: '#d4af37', fontWeight: 700 }}>₹{p.vipPrice}</td>
                    <td style={{ color: '#f59e0b' }}>₹{p.festivalPrice}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => openEditPriceModal(p)}
                          title="Edit Rate"
                          style={{
                            background: 'rgba(212, 175, 55, 0.12)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: '#f3e5ab',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePrice(p._id, `${p.garmentType} - ${p.alterationType}`)}
                          title="Delete Rate Rule"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.7rem'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. ADD / EDIT PRICE RULE MODAL */}
      {priceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d4af37' }}>
                  {editingPriceId ? 'Edit Price Rule' : 'Create New Price Rule'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Configure tier rates with dynamic multipliers
                </p>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setPriceModalOpen(false)} />
            </div>

            <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Garment Type *
                  </label>
                  <select
                    value={garmentType}
                    onChange={(e) => setGarmentType(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                  >
                    {GARMENT_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Alteration Type / Name *
                  </label>
                  <input
                    type="text"
                    value={alterationType}
                    onChange={(e) => setAlterationType(e.target.value)}
                    required
                    placeholder="e.g. Waist & Seat Adjustment"
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Normal Base Price (₹) * (1.0x)
                </label>
                <input
                  type="number"
                  value={normalPrice}
                  onChange={(e) => handleNormalPriceChange(e.target.value)}
                  required
                  min={10}
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#f3e5ab', marginBottom: '0.3rem' }}>
                    Urgent (1.5x) (₹)
                  </label>
                  <input
                    type="number"
                    value={urgentPrice}
                    onChange={(e) => setUrgentPrice(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#f3e5ab', marginBottom: '0.3rem' }}>
                    Very Urgent (2.0x) (₹)
                  </label>
                  <input
                    type="number"
                    value={veryUrgentPrice}
                    onChange={(e) => setVeryUrgentPrice(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#d4af37', marginBottom: '0.3rem', fontWeight: 600 }}>
                    VIP Royal (2.5x) (₹)
                  </label>
                  <input
                    type="number"
                    value={vipPrice}
                    onChange={(e) => setVipPrice(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.3rem' }}>
                    Festival Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={festivalPrice}
                    onChange={(e) => setFestivalPrice(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPriceModalOpen(false)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="btn-gold"
                  style={{ flex: 2, padding: '0.65rem' }}
                >
                  {savingPrice ? 'Saving Price...' : (editingPriceId ? 'Update Price Rule' : 'Save Price Rule')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Responsive Inline Styles */}
      <style>{`
        @media (max-width: 900px) {
          .responsive-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};

export default SuperAdminDashboard;
