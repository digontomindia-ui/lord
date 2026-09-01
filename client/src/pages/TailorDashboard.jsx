import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { Scissors, CheckCircle, Play, CheckCheck, RefreshCw, X, AlertCircle, Eye, Ruler, AlertTriangle } from 'lucide-react';

export const TailorDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Selected Order for Specification Modal
  const [specOrder, setSpecOrder] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, perfRes] = await Promise.all([
        apiClient.get('/dashboards/tailor').catch(() => ({ data: {} })),
        apiClient.get('/tailor/orders').catch(() => ({ data: [] })),
        apiClient.get('/tailor/performance').catch(() => ({ data: {} }))
      ]);
      setMetrics(dashRes?.data || {});
      setAssignedOrders(ordersRes?.data || []);
      setPerformance(perfRes?.data || {});
    } catch (err) {
      console.error('Error fetching tailor workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      await apiClient.post(`/tailor/orders/${orderId}/accept`);
      setFeedback({ type: 'success', message: 'Order acknowledged & accepted at workstation!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to accept order' });
    }
  };

  const handleStartWork = async (orderId) => {
    try {
      await apiClient.post(`/tailor/orders/${orderId}/start`);
      setFeedback({ type: 'success', message: 'Work started on garment alteration!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to start work' });
    }
  };

  const handleUpdateProgress = async (orderId, progress) => {
    try {
      await apiClient.post(`/tailor/orders/${orderId}/progress`, {
        progress,
        note: `Work progress updated to ${progress}%`
      });
      setFeedback({ type: 'success', message: `Progress updated to ${progress}%` });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update progress' });
    }
  };

  const handleCompleteWork = async (orderId) => {
    try {
      await apiClient.post(`/tailor/orders/${orderId}/complete`, {
        notes: 'Alteration finished and verified against precision measurements'
      });
      setFeedback({ type: 'success', message: 'Alteration completed and submitted to Master QC! Labor wage credited to wallet.' });
      if (specOrder?._id === orderId) setSpecOrder(null);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to complete work' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Tailor Workstation</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', color: '#d4af37', fontWeight: 600 }}>
              Bench Ops
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
            Active tailoring queue, precision measurements, progress milestones, and daily wage accrual
          </p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-gold)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#d4af37" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          borderRadius: '8px', 
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem'
        }}>
          <span>{feedback.message}</span>
          <X size={15} style={{ cursor: 'pointer' }} onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assigned Queue</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f3e5ab', marginTop: '0.3rem' }}>{assignedOrders.length}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Awaiting crafting</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Completed</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>
            {performance?.completedToday ?? (metrics?.completedToday || 0)}
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Dispatched to QC</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Labor Wage</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>₹{metrics?.earningsToday || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Credited to wallet</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quality Score</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.3rem' }}>
            {performance?.qualityScore ?? (metrics?.qualityScore || 100)}%
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>First-pass accuracy</p>
        </div>
      </div>

      {/* Assigned Orders List */}
      <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', color: '#d4af37', letterSpacing: '0.06em' }}>
          <Scissors size={16} color="#d4af37" /> Active Work Queue ({assignedOrders.length})
        </h3>

        {assignedOrders.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No pending alterations assigned to your station right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {assignedOrders.map((order) => (
              <div 
                key={order._id}
                style={{ 
                  background: 'rgba(16, 19, 26, 0.75)', 
                  border: '1px solid var(--border-gold)', 
                  padding: '0.9rem', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.875rem' }}>{order.orderNumber}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.68rem', padding: '0.12rem 0.4rem', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '3px', color: '#f3e5ab' }}>
                      {order.priority}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => setSpecOrder(order)}
                      style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#f3e5ab', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-xs)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Ruler size={13} /> View Measurements
                    </button>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#f3e5ab', borderRadius: 'var(--radius-xs)', fontSize: '0.72rem', fontWeight: 600 }}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem' }}>
                  <p><strong>Garment:</strong> {order.items?.[0]?.garmentType} • <strong>Alteration:</strong> {order.items?.[0]?.alterations?.type || 'Standard'}</p>
                  {order.specialNotes && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Notes: {order.specialNotes}</p>
                  )}
                  {order.items?.[0]?.damageNotes && (
                    <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertTriangle size={12} /> Pre-damage note: {order.items[0].damageNotes}
                    </p>
                  )}
                </div>

                {/* State Machine Action Controls */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem', borderTop: '1px solid var(--border-gold)', paddingTop: '0.5rem' }}>
                  {order.status === 'TAILOR_ASSIGNED' && (
                    <button 
                      onClick={() => handleAcceptOrder(order._id)}
                      className="btn-gold"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <CheckCircle size={13} /> Accept Order
                    </button>
                  )}

                  {(order.status === 'TAILOR_ACCEPTED' || order.status === 'REWORK_REQUIRED') && (
                    <button 
                      onClick={() => handleStartWork(order._id)}
                      style={{ background: '#f59e0b', color: '#161208', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Play size={13} /> Start Alteration
                    </button>
                  )}

                  {(order.status === 'WORK_STARTED' || order.status === 'WORK_IN_PROGRESS') && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Milestone:</span>
                      {[25, 50, 75, 90].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleUpdateProgress(order._id, pct)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-xs)', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          {pct}%
                        </button>
                      ))}
                      <button
                        onClick={() => handleCompleteWork(order._id)}
                        style={{ background: '#10b981', color: '#06281e', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.35rem' }}
                      >
                        <CheckCheck size={13} /> 100% & Submit QC
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAILOR MEASUREMENTS & SPECIFICATIONS MODAL */}
      {specOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '520px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-gold)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700 }}>WORKSTATION SPECIFICATION</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{specOrder.orderNumber}</h3>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setSpecOrder(null)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Garment & Alteration Type:</p>
                <p style={{ fontWeight: 700, color: '#f3e5ab' }}>
                  {specOrder.items?.[0]?.garmentType} • {specOrder.items?.[0]?.alterations?.type || 'Bespoke Fitting'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Client Measurement Specifications:</p>
                {specOrder.items?.[0]?.measurements && Object.keys(specOrder.items[0].measurements).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(16, 19, 26, 0.8)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-gold)' }}>
                    {Object.entries(specOrder.items[0].measurements).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                        <strong style={{ color: '#ffffff' }}>{v} in</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Standard sizing requested (no custom measurements logged).</p>
                )}
              </div>

              {specOrder.specialNotes && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Special Atelier Notes:</p>
                  <p style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px', color: '#ffffff' }}>
                    {specOrder.specialNotes}
                  </p>
                </div>
              )}

              {specOrder.items?.[0]?.damageNotes && (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.65rem', borderRadius: '4px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>Pre-Existing Fabric Damage:</p>
                  <p style={{ fontSize: '0.78rem', color: '#fde68a', marginTop: '0.2rem' }}>
                    {specOrder.items[0].damageNotes}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSpecOrder(null)}
                className="btn-gold"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                Close Spec
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TailorDashboard;
