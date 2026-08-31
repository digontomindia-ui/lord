import React, { useState, useEffect } from 'react';
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
  Search, Eye, ShieldCheck, ChevronRight, Package, CreditCard, Users 
} from 'lucide-react';

const PRIORITY_TIERS = [
  { id: 'NORMAL', label: 'Normal (Standard)', multiplier: 1 },
  { id: 'URGENT', label: 'Urgent (1.5x)', multiplier: 1.5 },
  { id: 'VERY_URGENT', label: 'Very Urgent (2.0x)', multiplier: 2.0 },
  { id: 'VIP', label: 'VIP Royal (2.5x)', multiplier: 2.5 },
  { id: 'FESTIVAL', label: 'Festival Priority', multiplier: 1.8 }
];

export const ShopDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Shop Operations Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>
            Capture bespoke customer alterations, monitor workshop progress, and manage 6-bucket financials
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={fetchDashboardData}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
          >
            <PlusCircle size={15} /> New Bespoke Order
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Today's Orders</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-light)', marginTop: '0.25rem' }}>{metrics?.todayOrders || 0}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Pickup</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>{metrics?.pending || 0}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>In Workshop Craft</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{metrics?.inProgress || 0}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ready for Delivery</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>{metrics?.ready || 0}</h2>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Main Wallet</p>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#c084fc', marginTop: '0.25rem' }}>₹{(wallet?.balances?.main || 0).toLocaleString()}</h2>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: activeTab === 'orders' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'orders' ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'orders' ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Package size={14} /> Store Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            background: activeTab === 'wallet' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'wallet' ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'wallet' ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <CreditCard size={14} /> 6-Bucket Wallet
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          style={{
            background: activeTab === 'crm' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'crm' ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'crm' ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Users size={14} /> Customer CRM ({customers.length})
        </button>
      </div>

      {/* Tab 1: Orders List */}
      {activeTab === 'orders' && (
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          {orders.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No orders found. Click <strong>"New Bespoke Order"</strong> to create your first alteration.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {orders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-light)', fontSize: '0.875rem' }}>
                        {order.orderNumber}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                        {order.priority}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                      <strong>{order.customerId?.name || 'Customer'}</strong> • {order.items?.[0]?.garmentType} ({order.items?.[0]?.alterations?.type || 'Alteration'})
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Price: ₹{order.pricing?.total || 0} • Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={order.status} size="sm" />

                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Eye size={13} /> Timeline
                    </button>

                    {order.status === 'ORDER_CREATED' && (
                      <button
                        onClick={() => handleRequestPickup(order._id)}
                        style={{ background: 'var(--warning)', color: 'black', border: 'none', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Truck size={13} /> Request Pickup
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
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
            <User size={15} color="var(--accent-primary)" /> Customer Directory ({customers.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {customers.map((c) => (
              <div key={c._id} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Phone: {c.mobile}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Code: {c.customerCode || 'CST-001'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Timeline Modal Drawer */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedOrder.orderNumber}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedOrder.items?.[0]?.garmentType} • {selectedOrder.items?.[0]?.alterations?.type}</p>
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(null)} />
            </div>

            <OrderTimeline timeline={selectedOrder.timeline || []} />
          </div>
        </div>
      )}

      {/* New Order Wizard Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>New Bespoke Alteration Wizard</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Step {step} of 3</p>
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => { setModalOpen(false); setStep(1); }} />
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Customer Name *</label>
                      <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. Vikram Malhotra" style={{ width: '100%', padding: '0.6rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Mobile Number *</label>
                      <input type="text" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} required placeholder="e.g. 9811223344" style={{ width: '100%', padding: '0.6rem' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 600 }}>Select Garment Family *</label>
                    <GarmentSelector selected={garmentType} onSelect={(g) => setGarmentType(g)} />
                  </div>

                  <button
                    type="button"
                    onClick={() => { if (customerName && customerMobile) setStep(2); }}
                    style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.25rem' }}
                  >
                    Continue to Measurements <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Alteration Specification</label>
                    <input type="text" value={alterationType} onChange={(e) => setAlterationType(e.target.value)} required placeholder="e.g. Taper sleeves by 1 inch, adjust shoulders" style={{ width: '100%', padding: '0.6rem' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 600 }}>Tailor Measurement Inputs ({garmentType})</label>
                    <MeasurementForm garmentType={garmentType} measurements={measurements} onChange={setMeasurements} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem' }}>Back</button>
                    <button type="button" onClick={() => setStep(3)} style={{ flex: 2, background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>Continue to Pricing <ArrowRight size={15} /></button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Priority Tier</label>
                      <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '0.6rem' }}>
                        {PRIORITY_TIERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Estimated Price (₹)</label>
                      <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required style={{ width: '100%', padding: '0.6rem' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Special Notes / Fabric Care</label>
                    <textarea rows={2} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder="Handle delicate silk/wool blend fabric carefully..." style={{ width: '100%', padding: '0.6rem' }} />
                  </div>

                  <div style={{ padding: '0.85rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span>Customer: <strong>{customerName}</strong> ({customerMobile})</span>
                      <span>Garment: <strong>{garmentType}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      <span>Tier: <strong>{priority}</strong></span>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>Total: ₹{itemPrice}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button type="button" onClick={() => setStep(2)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem' }}>Back</button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.8125rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'Placing Order...' : 'Confirm & Place Bespoke Order'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopDashboard;
