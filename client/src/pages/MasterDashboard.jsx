import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../shared/apiClient';
import { Scissors, CheckCircle, AlertTriangle, UserCheck, RefreshCw, X, ShieldCheck, ArrowRight } from 'lucide-react';

const MasterDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [receivingOrders, setReceivingOrders] = useState([]);
  const [qcOrders, setQcOrders] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Assign Modal State
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [selectedTailorId, setSelectedTailorId] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');

  // QC Modal State
  const [qcModalOrder, setQcModalOrder] = useState(null);
  const [qcReason, setQcReason] = useState('');
  const [qcInstructions, setQcInstructions] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, recRes, qcRes, tailorsRes] = await Promise.all([
        apiClient.get('/dashboards/master').catch(() => ({ data: {} })),
        apiClient.get('/workshop/receiving').catch(() => ({ data: [] })),
        apiClient.get('/workshop/qc').catch(() => ({ data: [] })),
        apiClient.get('/workshop/tailors').catch(() => ({ data: [] }))
      ]);

      setMetrics(dashRes?.data || {});
      setReceivingOrders(recRes?.data || []);
      setQcOrders(qcRes?.data || []);
      setTailors(tailorsRes?.data || []);
      if (tailorsRes?.data?.length > 0) {
        setSelectedTailorId(tailorsRes.data[0].userId?._id || tailorsRes.data[0].userId);
      }
    } catch (err) {
      console.error('Error fetching master workshop data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptReceiving = async (orderId) => {
    try {
      await apiClient.post(`/workshop/receiving/${orderId}/accept`, {
        notes: 'Inbound intake verified by Master'
      });
      setFeedback({ type: 'success', message: 'Garment intake verified and accepted into workshop!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to accept intake' });
    }
  };

  const handleAssignTailor = async (e) => {
    e.preventDefault();
    if (!assignModalOrder || !selectedTailorId) return;
    try {
      await apiClient.post(`/workshop/orders/${assignModalOrder._id}/assign-tailor`, {
        tailorId: selectedTailorId,
        instructions: assignInstructions || 'Standard alteration according to measurements'
      });
      setFeedback({ type: 'success', message: `Order assigned to Tailor successfully!` });
      setAssignModalOrder(null);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to assign tailor' });
    }
  };

  const handleApproveQC = async (orderId) => {
    try {
      await apiClient.post(`/workshop/qc/${orderId}/approve`, {
        measurementCheck: { passed: true },
        fittingCheck: { passed: true },
        finishingCheck: { passed: true },
        qualityCheck: { passed: true }
      });
      setFeedback({ type: 'success', message: 'Quality Check APPROVED! Garment is ready for dispatch.' });
      setQcModalOrder(null);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'QC approval failed' });
    }
  };

  const handleFailQC = async (e) => {
    e.preventDefault();
    if (!qcModalOrder || !qcReason) return;
    try {
      await apiClient.post(`/workshop/qc/${qcModalOrder._id}/fail`, {
        reason: qcReason,
        instructions: qcInstructions || qcReason
      });
      setFeedback({ type: 'success', message: 'QC marked FAILED. Corrective Rework ticket issued to Tailor.' });
      setQcModalOrder(null);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'QC rejection failed' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>✂️ Master Craft Workshop</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Oversee inbound logistics intake, tailor capacity allocation, and 4-point Quality Control.</p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Queue
        </button>
      </header>

      {/* Feedback Alert */}
      {feedback && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.5rem', 
          background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{feedback.message}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inbound Intake</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>{receivingOrders.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>In Production</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{metrics?.inProgress || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>QC Pending</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>{qcOrders.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ready for Dispatch</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>{metrics?.readyForDelivery || 0}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Inbound Intake Verification Queue */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Inbound Receiving Queue ({receivingOrders.length})
          </h3>
          {receivingOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No garments awaiting intake receipt.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {receivingOrders.map((order) => (
                <div key={order._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '4px' }}>{order.status}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.35rem' }}>{order.items?.[0]?.garmentType} • {order.items?.[0]?.alterations?.type}</p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleAcceptReceiving(order._id)}
                      style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Receive & Verify
                    </button>
                    <button 
                      onClick={() => setAssignModalOrder(order)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Assign Tailor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Control Audit Queue */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent-color)" /> Quality Control (QC) Queue ({qcOrders.length})
          </h3>
          {qcOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No garments awaiting Master QC inspection.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {qcOrders.map((order) => (
                <div key={order._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '4px' }}>Completed by {order.tailorId?.name || 'Tailor'}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.35rem' }}>{order.items?.[0]?.garmentType} • {order.items?.[0]?.alterations?.type}</p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleApproveQC(order._id)}
                      style={{ background: 'var(--success)', color: 'black', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✓ Approve QC
                    </button>
                    <button 
                      onClick={() => setQcModalOrder(order)}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✕ Fail & Rework
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tailor Assignment Modal */}
      {assignModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '450px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Assign Tailor: {assignModalOrder.orderNumber}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setAssignModalOrder(null)} />
            </div>
            <form onSubmit={handleAssignTailor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Select Workshop Tailor</label>
                <select value={selectedTailorId} onChange={(e) => setSelectedTailorId(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                  {tailors.map(t => (
                    <option key={t._id} value={t.userId?._id || t.userId}>
                      {t.name} ({t.specialization?.join(', ') || 'General'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Special Workshop Instructions</label>
                <textarea rows={3} value={assignInstructions} onChange={(e) => setAssignInstructions(e.target.value)} placeholder="e.g. Ensure double stitching on side seams" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
              </div>
              <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                Confirm Allocation
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* QC Failure Rework Modal */}
      {qcModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '450px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fca5a5' }}>Fail QC & Issue Rework Ticket</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setQcModalOrder(null)} />
            </div>
            <form onSubmit={handleFailQC} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Reason for Failure</label>
                <input type="text" value={qcReason} onChange={(e) => setQcReason(e.target.value)} required placeholder="e.g. Sleeve length 0.5 inch longer than specification" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Corrective Instructions for Tailor</label>
                <textarea rows={3} value={qcInstructions} onChange={(e) => setQcInstructions(e.target.value)} placeholder="e.g. Re-open hem, shorten by exact 0.5 inch and iron finish" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
              </div>
              <button type="submit" style={{ background: 'var(--error)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>
                Submit Rework Ticket
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default MasterDashboard;
