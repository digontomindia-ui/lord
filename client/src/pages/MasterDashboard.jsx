import React, { useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';
import { Scissors, CheckCircle, AlertTriangle, UserCheck, RefreshCw, X, ShieldCheck, ArrowRight, Package, Check, Clock } from 'lucide-react';

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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Master Craft Workshop</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', color: '#d4af37', fontWeight: 600 }}>
              Workshop Ops
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
            Inbound logistics intake, tailor capacity allocation, and 4-point Quality Control audit
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

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inbound Intake</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.3rem' }}>{receivingOrders.length}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Awaiting verification</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>In Production</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>{metrics?.inProgress || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>On workstations</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>QC Pending</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.3rem' }}>{qcOrders.length}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Awaiting inspection</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ready for Dispatch</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{metrics?.readyForDelivery || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Quality passed</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-split">
        
        {/* Inbound Intake Verification Queue */}
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Package size={16} color="#d4af37" /> Inbound Receiving Queue ({receivingOrders.length})
          </h3>
          {receivingOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No garments awaiting intake receipt.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {receivingOrders.map((order) => (
                <div key={order._id} style={{ background: 'rgba(16, 19, 26, 0.75)', border: '1px solid var(--border-gold)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.85rem' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '3px' }}>{order.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>{order.items?.[0]?.garmentType} • {order.items?.[0]?.alterations?.type}</p>
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleAcceptReceiving(order._id)}
                      className="btn-gold"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      Receive & Verify
                    </button>
                    <button 
                      onClick={() => setAssignModalOrder(order)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
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
        <div className="erp-card" style={{ padding: '1.1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShieldCheck size={16} color="#d4af37" /> Quality Control (QC) Queue ({qcOrders.length})
          </h3>
          {qcOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No garments awaiting Master QC inspection.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {qcOrders.map((order) => (
                <div key={order._id} style={{ background: 'rgba(16, 19, 26, 0.75)', border: '1px solid var(--border-gold)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.85rem' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '3px' }}>Completed by {order.tailorId?.name || 'Tailor'}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>{order.items?.[0]?.garmentType} • {order.items?.[0]?.alterations?.type}</p>
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleApproveQC(order._id)}
                      style={{ background: '#10b981', color: '#06281e', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d4af37' }}>Assign Tailor: {assignModalOrder.orderNumber}</h3>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setAssignModalOrder(null)} />
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
              <button type="submit" className="btn-gold" style={{ padding: '0.65rem', marginTop: '0.25rem' }}>
                Confirm Allocation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QC Failure Rework Modal */}
      {qcModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>Fail QC & Issue Rework Ticket</h3>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setQcModalOrder(null)} />
            </div>
            <form onSubmit={handleFailQC} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Reason for Failure</label>
                <input type="text" value={qcReason} onChange={(e) => setQcReason(e.target.value)} required placeholder="e.g. Sleeve length 0.5 inch longer than specification" style={{ width: '100%', padding: '0.65rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Corrective Instructions for Tailor</label>
                <textarea rows={3} value={qcInstructions} onChange={(e) => setQcInstructions(e.target.value)} placeholder="e.g. Re-open hem, shorten by exact 0.5 inch and iron finish" style={{ width: '100%', padding: '0.65rem' }} />
              </div>
              <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.25rem' }}>
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
