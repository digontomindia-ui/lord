import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../shared/apiClient';
import { PlusCircle, ShoppingBag, Truck, CheckCircle2, Clock, Wallet, AlertCircle, RefreshCw, X, ArrowRight } from 'lucide-react';

const GARMENT_TYPES = ['SHIRT', 'PANT', 'SUIT', 'BLAZER', 'SHERWANI', 'LADIES_WEAR', 'REPAIR'];
const PRIORITY_TIERS = ['NORMAL', 'URGENT', 'VERY_URGENT', 'VIP', 'FESTIVAL'];

const ShopDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // New Order Form State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [garmentType, setGarmentType] = useState('SHIRT');
  const [alterationDetail, setAlterationDetail] = useState('Sleeve Shortening');
  const [priority, setPriority] = useState('NORMAL');
  const [itemPrice, setItemPrice] = useState(150);
  const [specialNotes, setSpecialNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes] = await Promise.all([
        apiClient.get('/dashboards/shop').catch(() => ({ data: {} })),
        apiClient.get('/orders').catch(() => ({ data: [] }))
      ]);
      setMetrics(dashRes?.data || {});
      setOrders(ordersRes?.data || []);
    } catch (err) {
      console.error('Error loading shop dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      // 1. Create or ensure customer exists
      let customerId = null;
      try {
        const custRes = await apiClient.post('/shop/customers', {
          name: customerName,
          mobile: customerMobile
        });
        customerId = custRes?.data?._id;
      } catch (cErr) {
        // If customer exists, query by search
        const searchRes = await apiClient.get(`/shop/customers?search=${customerMobile}`);
        customerId = searchRes?.data?.[0]?._id;
      }

      // 2. Submit new order
      const orderPayload = {
        customerId,
        items: [{
          garmentType,
          quantity: 1,
          alterations: { type: alterationDetail },
          itemPrice: Number(itemPrice)
        }],
        priority,
        specialNotes,
        pricing: {
          subtotal: Number(itemPrice),
          total: Number(itemPrice)
        }
      };

      const res = await apiClient.post('/shop/orders', orderPayload);
      setFeedback({ type: 'success', message: `Order ${res?.data?.orderNumber || 'Created'} placed successfully!` });
      setModalOpen(false);
      // Reset fields
      setCustomerName('');
      setCustomerMobile('');
      setSpecialNotes('');
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create order' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPickup = async (orderId) => {
    try {
      await apiClient.post(`/orders/${orderId}/pickup-request`);
      setFeedback({ type: 'success', message: 'Pickup requested from Logistics Hub!' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to request pickup' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>🏬 Store Command Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage bespoke customer orders, measurements, and workshop tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={fetchData} 
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-glow)' }}
          >
            <PlusCircle size={20} /> New Order
          </button>
        </div>
      </header>

      {/* Feedback Banner */}
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

      {/* KPI Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Today's Orders</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-color)', marginTop: '0.25rem' }}>{metrics?.todayOrders || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Pickup</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>{metrics?.pending || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>In Workshop</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{metrics?.inProgress || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ready for Delivery</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>{metrics?.ready || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Store Wallet Balance</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', marginTop: '0.25rem' }}>₹{metrics?.walletBalance || 0}</h2>
        </div>
      </div>

      {/* Main Grid: Order List & Quick Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
            <ShoppingBag size={20} color="var(--accent-color)" /> Live Store Orders ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders found. Click <strong>"New Order"</strong> to create your first bespoke alteration.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orders.map((order) => (
                <div 
                  key={order._id}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border-color)', 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{order.orderNumber}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {order.priority}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>
                      <strong>{order.customerId?.name || 'Customer'}</strong> • {order.items?.[0]?.garmentType || 'Garment'} ({order.items?.[0]?.alterations?.type || 'Alteration'})
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Total: ₹{order.pricing?.total || 0} • Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: order.status.includes('CLOSED') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)', 
                      color: order.status.includes('CLOSED') ? '#86efac' : 'var(--accent-color)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.8rem', 
                      fontWeight: 600 
                    }}>
                      {order.status}
                    </span>

                    {order.status === 'ORDER_CREATED' && (
                      <button
                        onClick={() => handleRequestPickup(order._id)}
                        style={{ background: 'var(--warning)', color: 'black', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Truck size={14} /> Request Pickup
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Order Wizard Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>✨ New Bespoke Alteration Order</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setModalOpen(false)} />
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Customer Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. Rahul Sharma" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Mobile Number</label>
                  <input type="text" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} required placeholder="e.g. 9876543210" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Garment Type</label>
                  <select value={garmentType} onChange={(e) => setGarmentType(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                    {GARMENT_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Priority Tier</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                    {PRIORITY_TIERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Alteration Specification</label>
                <input type="text" value={alterationDetail} onChange={(e) => setAlterationDetail(e.target.value)} required placeholder="e.g. Sleeve Shortening 1.5 inch, waist taper" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Estimated Price (₹)</label>
                <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Special Instructions / Fabric Notes</label>
                <textarea rows={2} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder="Handle delicate silk fabric carefully..." style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
              </div>

              <button type="submit" disabled={submitting} style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {submitting ? 'Creating Order...' : 'Confirm & Place Order'} <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ShopDashboard;
