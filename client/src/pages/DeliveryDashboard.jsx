import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { Truck, MapPin, CheckCircle, RefreshCw, X, ShieldCheck, Key, Package } from 'lucide-react';

export const DeliveryDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pickupTasks, setPickupTasks] = useState([]);
  const [deliveryTasks, setDeliveryTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Delivery OTP Modal State
  const [otpModalTask, setOtpModalTask] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, pickRes, delRes] = await Promise.all([
        apiClient.get('/dashboards/delivery').catch(() => ({ data: {} })),
        apiClient.get('/delivery/pickups').catch(() => ({ data: [] })),
        apiClient.get('/delivery/deliveries').catch(() => ({ data: [] }))
      ]);
      setMetrics(dashRes?.data || {});
      setPickupTasks(pickRes?.data || []);
      setDeliveryTasks(delRes?.data || []);
    } catch (err) {
      console.error('Error fetching delivery tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollectPickup = async (taskId) => {
    try {
      await apiClient.post(`/delivery/pickups/${taskId}/collect`, {
        notes: 'Garment collected from Shop store'
      });
      setFeedback({ type: 'success', message: 'Pickup collected and marked in transit to Workshop!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to collect pickup' });
    }
  };

  const handleCompleteDeliveryOTP = async (e) => {
    e.preventDefault();
    if (!otpModalTask || !otpCode) return;
    try {
      await apiClient.post(`/delivery/deliveries/${otpModalTask._id}/complete`, {
        otp: otpCode,
        notes: 'Delivered to Shop with customer OTP verification'
      });
      setFeedback({ type: 'success', message: 'Delivery successfully verified with OTP & closed!' });
      setOtpModalTask(null);
      setOtpCode('');
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'OTP verification failed' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Logistics Fleet Center</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', color: '#d4af37', fontWeight: 600 }}>
              Fleet Ops
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
            Live pickup collection tasks, return deliveries, and OTP handover verification
          </p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-gold)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#d4af37" />
          <span>Refresh Fleet Tasks</span>
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

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pickups Pending</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.3rem' }}>{pickupTasks.length}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>From retail stores</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Return Deliveries</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>{deliveryTasks.length}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Ready for handover</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed Today</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{metrics?.completedToday || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>100% verified</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fleet Payout</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f3e5ab', marginTop: '0.3rem' }}>₹{metrics?.earningsToday || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Wallet earnings</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-split">
        
        {/* Pickup Tasks Section */}
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', color: '#d4af37', letterSpacing: '0.06em' }}>
            <Package size={15} color="#d4af37" /> Store Pickup Tasks ({pickupTasks.length})
          </h3>

          {pickupTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No pending shop pickups allocated.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pickupTasks.map((task) => (
                <div key={task._id} style={{ background: 'rgba(16, 19, 26, 0.75)', border: '1px solid var(--border-gold)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.85rem' }}>Task #{task.taskNumber || task._id.slice(-6)}</span>
                    <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '3px' }}>{task.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                    <strong>{task.shopId?.shopName || 'Shop'}:</strong> {task.pickupLocation?.address || 'Shop Location'}
                  </p>
                  <div style={{ marginTop: '0.65rem' }}>
                    <button 
                      onClick={() => handleCollectPickup(task._id)}
                      className="btn-gold"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <CheckCircle size={13} /> Collect & Transport
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Return Delivery Tasks Section */}
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', color: '#d4af37', letterSpacing: '0.06em' }}>
            <Truck size={15} color="#d4af37" /> Return Delivery Tasks ({deliveryTasks.length})
          </h3>

          {deliveryTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No ready garments requiring store return.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {deliveryTasks.map((task) => (
                <div key={task._id} style={{ background: 'rgba(16, 19, 26, 0.75)', border: '1px solid var(--border-gold)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.85rem' }}>Task #{task.taskNumber || task._id.slice(-6)}</span>
                    <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '3px' }}>{task.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                    <strong>Destination:</strong> {task.to?.address || 'Shop Destination'}
                  </p>
                  <div style={{ marginTop: '0.65rem' }}>
                    <button 
                      onClick={() => setOtpModalTask(task)}
                      style={{ background: '#10b981', color: '#06281e', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Key size={13} /> Complete with OTP Handover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* OTP Delivery Verification Modal */}
      {otpModalTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d4af37' }}>OTP Handover Verification</h3>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setOtpModalTask(null)} />
            </div>
            <form onSubmit={handleCompleteDeliveryOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Enter 4-Digit Customer / Shop OTP</label>
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required placeholder="e.g. 1234" maxLength={6} style={{ width: '100%', padding: '0.65rem', textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.1rem', fontWeight: 800 }} />
              </div>
              <button type="submit" className="btn-gold" style={{ padding: '0.65rem', marginTop: '0.25rem' }}>
                Verify & Close Delivery
              </button>
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

export default DeliveryDashboard;
