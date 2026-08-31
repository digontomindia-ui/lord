import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { orderService, customerService, walletService, masterService } from '../services/apiServices';
import apiClient from '../shared/apiClient';
import StatusBadge from '../components/ui/StatusBadge';
import OrderTimeline from '../components/order/OrderTimeline';
import GarmentSelector from '../components/order/GarmentSelector';
import MeasurementForm from '../components/order/MeasurementForm';
import Wallet6BucketGrid from '../components/wallet/Wallet6BucketGrid';
import { 
  PlusCircle, ShoppingBag, Truck, CheckCircle2, Clock, 
  Wallet, AlertCircle, RefreshCw, X, ArrowRight, User, 
  Search, Eye, ShieldCheck, ChevronRight 
} from 'lucide-react';

const PRIORITY_TIERS = [
  { id: 'NORMAL', label: 'Normal (Standard)', multiplier: 1 },
  { id: 'URGENT', label: 'Urgent (1.5x)', multiplier: 1.5 },
  { id: 'VERY_URGENT', label: 'Very Urgent (2.0x)', multiplier: 2.0 },
  { id: 'VIP', label: 'VIP Royal (2.5x)', multiplier: 2.5 },
  { id: 'FESTIVAL', label: 'Festival Priority', multiplier: 1.8 }
];

export const ShopDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wallet' | 'crm'
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // New Order Wizard State
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Wizard Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [garmentType, setGarmentType] = useState('SHIRT');
  const [alterationType, setAlterationType] = useState('Sleeve Shortening');
  const [measurements, setMeasurements] = useState({});
  const [priority, setPriority] = useState('NORMAL');
  const [itemPrice, setItemPrice] = useState(150);
  const [specialNotes, setSpecialNotes] = useState('');

  // Selected Order for Timeline Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, walletRes, custRes] = await Promise.all([
        apiClient.get('/dashboards/shop').catch(() => ({ data: {} })),
        orderService.getOrders().catch(() => ({ data: [] })),
        walletService.getWallet().catch(() => ({ data: { balances: {} } })),
        customerService.getCustomers().catch(() => ({ data: [] }))
      ]);

      setMetrics(dashRes?.data || {});
      setOrders(ordersRes?.data || []);
      setWallet(walletRes?.data || {});
      setCustomers(custRes?.data || []);
    } catch (err) {
      console.error('Error fetching shop dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      // 1. Create or retrieve customer
      let customerId = null;
      try {
        const custRes = await customerService.createCustomer({
          name: customerName,
          mobile: customerMobile
        });
        customerId = custRes?.data?._id;
      } catch (cErr) {
        const searchRes = await customerService.getCustomers({ search: customerMobile });
        customerId = searchRes?.data?.[0]?._id;
      }

      // 2. Submit order
      const orderPayload = {
        customerId,
        items: [{
          garmentType,
          quantity: 1,
          alterations: { type: alterationType },
          measurements,
          itemPrice: Number(itemPrice)
        }],
        priority,
        specialNotes,
        pricing: {
          subtotal: Number(itemPrice),
          total: Number(itemPrice)
        }
      };

      const res = await orderService.createOrder(orderPayload);
      setFeedback({ type: 'success', message: `Order ${res?.data?.orderNumber || 'Created'} confirmed successfully!` });
      setModalOpen(false);
      setStep(1);
      // Reset
      setCustomerName('');
      setCustomerMobile('');
      setSpecialNotes('');
      setMeasurements({});
      fetchDashboardData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create order' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPickup = async (orderId) => {
    try {
      await orderService.requestPickup(orderId, 'Shop pickup dispatch request');
      setFeedback({ type: 'success', message: 'Pickup dispatched to Logistics Fleet!' });
      fetchDashboardData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to dispatch pickup' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>🏬 Shop Operations Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Capture bespoke customer alterations, monitor workshop progress, and manage 6-bucket financials.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchDashboardData}
            style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', boxShadow: 'var(--shadow-glow)' }}
          >
            <PlusCircle size={18} /> New Bespoke Order
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem'
        }}>
          <span>{feedback.message}</span>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Today's Orders</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-color)', marginTop: '0.2rem' }}>{metrics?.todayOrders || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Pickup</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.2rem' }}>{metrics?.pending || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>In Workshop Craft</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>{metrics?.inProgress || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ready for Delivery</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.2rem' }}>{metrics?.ready || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Main Wallet</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>₹{(wallet?.balances?.main || 0).toLocaleString()}</h2>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: activeTab === 'orders' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'orders' ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'orders' ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          📦 Store Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            background: activeTab === 'wallet' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'wallet' ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'wallet' ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          💳 6-Bucket Wallet
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          style={{
            background: activeTab === 'crm' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'crm' ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'crm' ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          👥 Customer CRM ({customers.length})
        </button>
      </div>

      {/* Tab 1: Orders List */}
      {activeTab === 'orders' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders found. Click <strong>"New Bespoke Order"</strong> to create your first alteration.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {orders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                  className="hover-lift"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: '1.05rem' }}>
                        {order.orderNumber}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {order.priority}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.35rem', fontSize: '0.95rem' }}>
                      <strong>{order.customerId?.name || 'Customer'}</strong> • {order.items?.[0]?.garmentType} ({order.items?.[0]?.alterations?.type || 'Alteration'})
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Price: ₹{order.pricing?.total || 0} • Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={order.status} />

                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Eye size={14} /> Timeline
                    </button>

                    {order.status === 'ORDER_CREATED' && (
                      <button
                        onClick={() => handleRequestPickup(order._id)}
                        style={{ background: 'var(--warning)', color: 'black', border: 'none', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
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
      )}

      {/* Tab 2: 6-Bucket Wallet */}
      {activeTab === 'wallet' && (
        <Wallet6BucketGrid balances={wallet?.balances || {}} onRefresh={fetchDashboardData} />
      )}

      {/* Tab 3: Customer CRM */}
      {activeTab === 'crm' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--accent-color)" /> Customer Directory ({customers.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {customers.map((c) => (
              <div key={c._id} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>📱 {c.mobile}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Code: {c.customerCode || 'CST-001'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Timeline Modal Drawer */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedOrder.orderNumber}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOrder.items?.[0]?.garmentType} • {selectedOrder.items?.[0]?.alterations?.type}</p>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(null)} />
            </div>

            <OrderTimeline timeline={selectedOrder.timeline || []} />
          </div>
        </div>
      )}

      {/* New 10-Step Order Wizard Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>✨ New Bespoke Alteration Wizard</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Step {step} of 3</p>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setModalOpen(false); setStep(1); }} />
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Step 1: Customer & Garment Type */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Customer Name *</label>
                      <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. Vikram Malhotra" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Mobile Number *</label>
                      <input type="text" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} required placeholder="e.g. 9811223344" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Select Garment Family *</label>
                    <GarmentSelector selected={garmentType} onSelect={(g) => setGarmentType(g)} />
                  </div>

                  <button
                    type="button"
                    onClick={() => { if (customerName && customerMobile) setStep(2); }}
                    style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
                  >
                    Continue to Measurements <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 2: Measurements & Alteration Specs */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Alteration Specification</label>
                    <input type="text" value={alterationType} onChange={(e) => setAlterationType(e.target.value)} required placeholder="e.g. Taper sleeves by 1 inch, adjust shoulders" style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Tailor Measurement Inputs ({garmentType})</label>
                    <MeasurementForm garmentType={garmentType} measurements={measurements} onChange={setMeasurements} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Back</button>
                    <button type="button" onClick={() => setStep(3)} style={{ flex: 2, background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>Continue to Pricing <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {/* Step 3: Priority & Confirmation */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Priority Tier</label>
                      <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                        {PRIORITY_TIERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Estimated Price (₹)</label>
                      <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Special Notes / Fabric Care</label>
                    <textarea rows={2} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder="Handle delicate silk/wool blend fabric carefully..." style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                  </div>

                  {/* Summary Card */}
                  <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Customer: <strong>{customerName}</strong> ({customerMobile})</span>
                      <span>Garment: <strong>{garmentType}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                      <span>Tier: <strong>{priority}</strong></span>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>Total: ₹{itemPrice}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setStep(2)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Back</button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'Placing Order...' : 'Confirm & Place Bespoke Order'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default ShopDashboard;
