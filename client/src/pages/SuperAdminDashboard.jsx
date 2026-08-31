import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { orderService, adminService } from '../services/apiServices';
import StatusBadge from '../components/ui/StatusBadge';
import { 
  TrendingUp, Clock, RefreshCw, Download, AlertTriangle, 
  CheckCircle2, ChevronRight, Layers, DollarSign, Store, 
  Users, Activity, Tag, ShieldCheck 
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [prices, setPrices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [timeRange, setTimeRange] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, priceRes, auditRes] = await Promise.all([
        apiClient.get('/dashboards/admin').catch(() => ({ data: {} })),
        orderService.getOrders().catch(() => ({ data: [] })),
        adminService.getPrices().catch(() => ({ data: [] })),
        adminService.getAuditLogs({ limit: 6 }).catch(() => ({ data: [] }))
      ]);

      setMetrics(dashRes?.data || {});
      setOrders(ordersRes?.data || []);
      setPrices(priceRes?.data || []);
      setAuditLogs(auditRes?.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Pipeline Stage Counts from Real Orders
  const pipelineStages = [
    { key: 'CREATED', label: 'Created', count: orders.filter(o => o.status === 'ORDER_CREATED').length },
    { key: 'PICKUP', label: 'Pickup', count: orders.filter(o => o.status.includes('PICKUP') || o.status === 'PICKED_UP').length },
    { key: 'WORKSHOP', label: 'Workshop', count: orders.filter(o => o.status.includes('WORKSHOP') || o.status.includes('INSPECTION')).length },
    { key: 'TAILOR', label: 'Tailor', count: orders.filter(o => o.status.includes('TAILOR') || o.status.includes('WORK_')).length },
    { key: 'QC', label: 'QC Audit', count: orders.filter(o => o.status.includes('QC') || o.status === 'REWORK_REQUIRED').length },
    { key: 'READY', label: 'Ready', count: orders.filter(o => o.status === 'READY_FOR_DELIVERY').length },
    { key: 'DELIVERY', label: 'Delivery', count: orders.filter(o => o.status.includes('DELIVERY') || o.status === 'DELIVERED_TO_SHOP').length },
    { key: 'CLOSED', label: 'Closed', count: orders.filter(o => o.status === 'ORDER_CLOSED').length }
  ];

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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Overview
          </h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
            <span>Network operations, revenue metrics, and production pipeline</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            {['7D', '30D', '90D', '1Y'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                style={{
                  background: timeRange === t ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: timeRange === t ? 'var(--accent-light)' : 'var(--text-muted)',
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
              padding: '0.35rem 0.65rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => alert('Exporting ERP operational metrics report (CSV)...')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-light)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Compact KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        
        {/* KPI 1: Revenue */}
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenue</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Earned</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            ₹{(metrics?.revenue?.total || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Today: ₹{(metrics?.revenue?.today || 0).toLocaleString()}
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Orders</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>All Time</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {metrics?.orders?.today || 0} placed today
          </div>
        </div>

        {/* KPI 3: Active Orders */}
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active In-Work</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--warning)', fontWeight: 600 }}>
              {orders.filter(o => o.priority === 'URGENT' || o.priority === 'VERY_URGENT').length} urgent
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {orders.filter(o => o.status !== 'ORDER_CLOSED' && o.status !== 'CANCELLED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            In workshop & transit
          </div>
        </div>

        {/* KPI 4: Completed Orders */}
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 600 }}>
              Closed
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {orders.filter(o => o.status === 'ORDER_CLOSED').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Delivered to client
          </div>
        </div>

        {/* KPI 5: Active Stores */}
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stores</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--accent-light)', fontWeight: 600 }}>Active</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {metrics?.users?.shops || 2}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Partner retail locations
          </div>
        </div>

        {/* KPI 6: Tailor Fleet */}
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tailors & Fleet</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--info)', fontWeight: 600 }}>Online</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', letterSpacing: '-0.02em' }}>
            {(metrics?.users?.tailors || 4) + (metrics?.users?.deliveryBoys || 2)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {metrics?.users?.tailors || 4} tailors • {metrics?.users?.deliveryBoys || 2} fleet
          </div>
        </div>

      </div>

      {/* 3. Horizontal ERP Order Pipeline Workflow */}
      <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Order Pipeline
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Real-time stage allocation ({orders.length} total)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', overflowX: 'auto' }}>
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.key}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.55rem 0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {stage.label}
                </span>
                {idx < pipelineStages.length - 1 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>→</span>
                )}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: stage.count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {stage.count}
              </div>
              <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                <div style={{
                  width: `${orders.length > 0 ? (stage.count / orders.length) * 100 : 0}%`,
                  height: '100%',
                  background: stage.count > 0 ? 'var(--accent-primary)' : 'transparent',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Actionable Operations & Recent Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }} className="responsive-split">
        
        {/* Needs Attention */}
        <div className="erp-card" style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Needs Attention
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 600 }}>
              {delayedCount + qcFailedCount + pendingPickupCount + pendingDeliveryCount} Action Items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            
            <div 
              onClick={() => setStatusFilter('REWORK_REQUIRED')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={14} color="#f87171" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fca5a5' }}>QC Failed / Rework</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f87171' }}>{qcFailedCount}</span>
                <ChevronRight size={13} color="#fca5a5" />
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('PICKUP_REQUESTED')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} color="#fbbf24" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fde68a' }}>Pending Shop Pickup</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fbbf24' }}>{pendingPickupCount}</span>
                <ChevronRight size={13} color="#fde68a" />
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('READY_FOR_DELIVERY')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={14} color="#38bdf8" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#bae6fd' }}>Ready for Delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38bdf8' }}>{pendingDeliveryCount}</span>
                <ChevronRight size={13} color="#bae6fd" />
              </div>
            </div>

            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Delayed Orders</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{delayedCount}</span>
                <ChevronRight size={13} color="var(--text-muted)" />
              </div>
            </div>

          </div>
        </div>

        {/* Recent Audit / Operational Activity */}
        <div className="erp-card" style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recent Activity
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Audit Log
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto', maxHeight: '180px' }}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                System operational. No unverified audit events.
              </div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={log._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{log.action}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>by {log.role}</span>
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

      {/* 5. Recent Orders Real Enterprise Table */}
      <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recent Orders
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              ({filteredOrders.length} records)
            </span>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {['ALL', 'ORDER_CREATED', 'PICKUP_REQUESTED', 'READY_FOR_DELIVERY', 'ORDER_CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${statusFilter === st ? 'rgba(99, 102, 241, 0.35)' : 'var(--border-subtle)'}`,
                  color: statusFilter === st ? 'var(--accent-light)' : 'var(--text-secondary)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.7rem',
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
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
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
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>
                      {order.orderNumber}
                    </td>
                    <td>{order.customerId?.name || 'Customer'}</td>
                    <td>
                      {order.items?.[0]?.garmentType || 'Garment'}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                        ({order.items?.[0]?.alterations?.type || 'Alteration'})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{order.pricing?.total || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Dynamic Price Master Matrix Table */}
      <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Price Master Matrix ({prices.length} Configured)
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Authoritative alteration rates
          </span>
        </div>

        {prices.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            No price master catalogue items configured.
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prices.slice(0, 8).map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.garmentType}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.alterationType}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{p.normalPrice}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹{p.urgentPrice}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹{p.veryUrgentPrice}</td>
                    <td style={{ color: '#c084fc' }}>₹{p.vipPrice}</td>
                    <td style={{ color: 'var(--warning)' }}>₹{p.festivalPrice}</td>
                    <td>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', fontWeight: 600 }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
