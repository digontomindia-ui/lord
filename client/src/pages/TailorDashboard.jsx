import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../shared/apiClient';
import { Scissors, CheckCircle, Play, CheckCheck, RefreshCw, X, AlertCircle, Sparkles } from 'lucide-react';

const TailorDashboard = () => {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🧵 Tailor Workspace</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your active tailoring queue, progress milestones, and daily earned wage.</p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {/* Feedback Alert */}
      {feedback && (
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.25rem', 
          background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem'
        }}>
          <span>{feedback.message}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Queue</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-color)', marginTop: '0.2rem' }}>{assignedOrders.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Today's Completed</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>{metrics?.completedToday || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Today's Labor Earnings</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>₹{metrics?.earningsToday || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quality Score</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#a855f7', marginTop: '0.2rem' }}>{metrics?.qualityScore || 100}%</h2>
        </div>
      </div>

      {/* Assigned Orders List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scissors size={18} color="var(--accent-color)" /> Active Work Queue ({assignedOrders.length})
        </h3>

        {assignedOrders.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pending alterations assigned to your station right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignedOrders.map((order) => (
              <div 
                key={order._id}
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-color)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '1.05rem' }}>{order.orderNumber}</span>
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                      {order.priority}
                    </span>
                  </div>
                  <span style={{ padding: '0.25rem 0.65rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {order.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem' }}>
                  <p><strong>Garment:</strong> {order.items?.[0]?.garmentType} • <strong>Alteration:</strong> {order.items?.[0]?.alterations?.type || 'Standard'}</p>
                  {order.specialNotes && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Notes: {order.specialNotes}</p>
                  )}
                </div>

                {/* State Machine Action Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                  {order.status === 'TAILOR_ASSIGNED' && (
                    <button 
                      onClick={() => handleAcceptOrder(order._id)}
                      style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <CheckCircle size={14} /> Accept Order
                    </button>
                  )}

                  {(order.status === 'TAILOR_ACCEPTED' || order.status === 'REWORK_REQUIRED') && (
                    <button 
                      onClick={() => handleStartWork(order._id)}
                      style={{ background: 'var(--warning)', color: 'black', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Play size={14} /> Start Alteration
                    </button>
                  )}

                  {(order.status === 'WORK_STARTED' || order.status === 'WORK_IN_PROGRESS') && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Update:</span>
                      {[25, 50, 75, 90].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleUpdateProgress(order._id, pct)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid var(--border-color)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {pct}%
                        </button>
                      ))}
                      <button
                        onClick={() => handleCompleteWork(order._id)}
                        style={{ background: 'var(--success)', color: 'black', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}
                      >
                        <CheckCheck size={14} /> 100% & Complete Work
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default TailorDashboard;
