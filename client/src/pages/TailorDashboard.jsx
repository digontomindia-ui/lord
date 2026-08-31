import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { Scissors, CheckCircle, Play, CheckCheck, RefreshCw, X, AlertCircle } from 'lucide-react';

export const TailorDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes] = await Promise.all([
        apiClient.get('/dashboards/tailor').catch(() => ({ data: {} })),
        apiClient.get('/tailor/orders').catch(() => ({ data: [] }))
      ]);
      setMetrics(dashRes?.data || {});
      setAssignedOrders(ordersRes?.data || []);
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
      setFeedback({ type: 'success', message: 'Order acknowledged & accepted!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to accept order' });
    }
  };

  const handleStartWork = async (orderId) => {
    try {
      await apiClient.post(`/tailor/orders/${orderId}/start`);
      setFeedback({ type: 'success', message: 'Work started on order!' });
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
        notes: 'Alteration finished and verified against measurements'
      });
      setFeedback({ type: 'success', message: 'Alteration completed and submitted to Master QC! Daily earnings updated.' });
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
            Active tailoring queue, progress milestones, and daily earned wage
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
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{metrics?.completedToday || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Dispatched to QC</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Labor Wage</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>₹{metrics?.earningsToday || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Credited to wallet</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quality Score</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.3rem' }}>{metrics?.qualityScore || 100}%</h2>
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
                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#f3e5ab', borderRadius: 'var(--radius-xs)', fontSize: '0.72rem', fontWeight: 600 }}>
                    {order.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8125rem' }}>
                  <p><strong>Garment:</strong> {order.items?.[0]?.garmentType} • <strong>Alteration:</strong> {order.items?.[0]?.alterations?.type || 'Standard'}</p>
                  {order.specialNotes && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Notes: {order.specialNotes}</p>
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

    </div>
  );
};

export default TailorDashboard;
