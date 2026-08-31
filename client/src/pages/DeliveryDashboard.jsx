import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../shared/apiClient';
import { Truck, MapPin, CheckCircle, RefreshCw, X, PackageCheck, ArrowRight, ShieldCheck } from 'lucide-react';

const DeliveryDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, tasksRes] = await Promise.all([
        apiClient.get('/dashboards/delivery').catch(() => ({ data: {} })),
        apiClient.get('/delivery/tasks').catch(() => ({ data: { pickups: [], deliveries: [] } }))
      ]);
      setMetrics(dashRes?.data || {});
      setPickups(tasksRes?.data?.pickups || []);
      setDeliveries(tasksRes?.data?.deliveries || []);
    } catch (err) {
      console.error('Error fetching delivery fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptTask = async (taskId) => {
    try {
      await apiClient.post(`/delivery/tasks/${taskId}/accept`);
      setFeedback({ type: 'success', message: 'Task accepted! Route assigned.' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to accept task' });
    }
  };

  const handleMarkArrived = async (taskId) => {
    try {
      await apiClient.post(`/delivery/tasks/${taskId}/arrived`);
      setFeedback({ type: 'success', message: 'Checked in at location!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to check in' });
    }
  };

  const handleCollectGarments = async (taskId) => {
    try {
      await apiClient.post(`/delivery/tasks/${taskId}/collect`);
      setFeedback({ type: 'success', message: 'Garments collected from origin!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to collect garments' });
    }
  };

  const handleCompleteDelivery = async (taskId) => {
    try {
      await apiClient.post(`/delivery/tasks/${taskId}/complete`, {
        otp: '1234',
        signature: 'Shop Verified Signature'
      });
      setFeedback({ type: 'success', message: 'Delivery completed successfully! Payout credited to your wallet.' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to complete delivery' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🛵 Logistics Fleet Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time shop pickups, workshop returns, and proof of delivery.</p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Fleet
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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Pickups</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.2rem' }}>{metrics?.todayPickup || pickups.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Deliveries</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>{metrics?.todayDelivery || deliveries.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Today</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>{metrics?.completedToday || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Today's Delivery Fee</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#a855f7', marginTop: '0.2rem' }}>₹{metrics?.earningsToday || 0}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Shop Pickup Tasks */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} color="var(--warning)" /> Store Pickups ({pickups.length})
          </h3>
          {pickups.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending shop pickups assigned.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pickups.map((task) => (
                <div key={task._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{task.orderId?.orderNumber || 'Order'}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '4px' }}>{task.status}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                    📍 <strong>{task.shopId?.shopName || 'Shop'}:</strong> {task.pickupLocation?.address}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Quantity: {task.quantity || 1} garment(s)
                  </p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleCollectGarments(task._id)}
                      style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Collect Garment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Return to Shop Deliveries */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageCheck size={18} color="var(--success)" /> Workshop Return Deliveries ({deliveries.length})
          </h3>
          {deliveries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No ready garments awaiting return dispatch.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deliveries.map((task) => (
                <div key={task._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{task.orderId?.orderNumber || 'Order'}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '4px' }}>{task.status}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                    📍 <strong>Destination:</strong> {task.to?.address || 'Shop Destination'}
                  </p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleCompleteDelivery(task._id)}
                      style={{ background: 'var(--success)', color: 'black', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Deliver & Handover (OTP)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </motion.div>
  );
};

export default DeliveryDashboard;
