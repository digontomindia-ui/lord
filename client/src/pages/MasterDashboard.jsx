import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { Scissors, CheckCircle, AlertTriangle, UserCheck, RefreshCw, X, ShieldCheck, ArrowRight, Package, Check } from 'lucide-react';

export const MasterDashboard = () => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Master Craft Workshop
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>
            Inbound logistics intake, tailor capacity allocation, and 4-point Quality Control
          </p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div style={{ 
          padding: '0.65rem 0.85rem', 
          borderRadius: 'var(--radius-sm)', 
          background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--error-border)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem'
        }}>
          <span>{feedback.message}</span>
          <X size={15} style={{ cursor: 'pointer' }} onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inbound Intake</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>{receivingOrders.length}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>In Production</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{metrics?.inProgress || 0}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>QC Pending</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>{qcOrders.length}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ready for Dispatch</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>{metrics?.readyForDelivery || 0}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-split">
        
        {/* Inbound Intake Verification Queue */}
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            <Package size={16} color="var(--accent-light)" /> Inbound Receiving Queue ({receivingOrders.length})
          </h3>
          {receivingOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No garments awaiting intake receipt.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {receivingOrders.map((order) => (
                <div key={order._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-light)', fontSize: '0.85rem' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '3px' }}>{order.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>{order.items?.[0]?.garmentType} • {order.items?.[0]?.alterations?.type}</p>
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleAcceptReceiving(order._id)}
                      style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Receive & Verify
                    </button>
                    <button 
                      onClick={() => setAssignModalOrder(order)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
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
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            <ShieldCheck size={16} color="var(--accent-light)" /> Quality Control (QC) Queue ({qcOrders.length})
          </h3>
          {qcOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No garments awaiting Master QC inspection.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {qcOrders.map((order) => (
                <div key={order._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-light)', fontSize: '0.85rem' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '3px' }}>Completed by {order.tailorId?.name || 'Tailor'}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>{order.items?.[0]?.garmentType} • {order.items?.[0]?.alterations?.type}</p>
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleApproveQC(order._id)}
                      style={{ background: 'var(--success)', color: 'black', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Approve QC
                    </button>
                    <button 
                      onClick={() => setQcModalOrder(order)}
                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Fail & Rework
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
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Assign Tailor: {assignModalOrder.orderNumber}</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setAssignModalOrder(null)} />
            </div>
            <form onSubmit={handleAssignTailor} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Select Workshop Tailor</label>
                <select value={selectedTailorId} onChange={(e) => setSelectedTailorId(e.target.value)} style={{ width: '100%', padding: '0.65rem' }}>
                  {tailors.map(t => (
                    <option key={t._id} value={t.userId?._id || t.userId}>
                      {t.name} ({t.specialization?.join(', ') || 'General'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Workshop Instructions</label>
                <textarea rows={3} value={assignInstructions} onChange={(e) => setAssignInstructions(e.target.value)} placeholder="e.g. Ensure double stitching on side seams" style={{ width: '100%', padding: '0.65rem' }} />
              </div>
              <button type="submit" style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                Confirm Allocation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QC Failure Rework Modal */}
      {qcModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fca5a5' }}>Fail QC & Issue Rework Ticket</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setQcModalOrder(null)} />
            </div>
            <form onSubmit={handleFailQC} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Reason for Failure</label>
                <input type="text" value={qcReason} onChange={(e) => setQCReason(e.target.value)} required placeholder="e.g. Sleeve length 0.5 inch longer than specification" style={{ width: '100%', padding: '0.65rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Corrective Instructions for Tailor</label>
                <textarea rows={3} value={qcInstructions} onChange={(e) => setQcInstructions(e.target.value)} placeholder="e.g. Re-open hem, shorten by exact 0.5 inch and iron finish" style={{ width: '100%', padding: '0.65rem' }} />
              </div>
              <button type="submit" style={{ background: 'var(--error)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                Submit Rework Ticket
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

export default MasterDashboard;
