import React, { useState, useEffect, useMemo } from 'react';
import { orderService, customerService, walletService, invoiceService, referralService } from '../services/apiServices';
import apiClient from '../shared/apiClient';
import StatusBadge from '../components/ui/StatusBadge';
import OrderTimeline from '../components/order/OrderTimeline';
import GarmentSelector from '../components/order/GarmentSelector';
import MeasurementForm from '../components/order/MeasurementForm';
import Wallet6BucketGrid from '../components/wallet/Wallet6BucketGrid';
import { 
  PlusCircle, ShoppingBag, Truck, CheckCircle2, Clock, 
  Wallet, AlertCircle, RefreshCw, X, ArrowRight, User, 
  Search, Eye, ShieldCheck, ChevronRight, Package, CreditCard, Users, 
  Printer, FileText, Share2, Copy, Check, Calendar, AlertTriangle
} from 'lucide-react';

export const GARMENT_CONFIG = {
  SHIRT: {
    alterations: ['Sleeve Shortening', 'Sides Tapering', 'Collar Replacement', 'Shoulder Narrowing', 'Length Hemming'],
    deliveryDays: { NORMAL: 4, URGENT: 2, VERY_URGENT: 1, VIP: 0.5, FESTIVAL: 3 }
  },
  PANT: {
    alterations: ['Length Hemming', 'Waist & Seat Alteration', 'Leg Slimming / Tapering', 'Zip Replacement', 'Elastic Insertion'],
    deliveryDays: { NORMAL: 4, URGENT: 2, VERY_URGENT: 1, VIP: 0.5, FESTIVAL: 3 }
  },
  SUIT: {
    alterations: ['Complete Suit Fitting', 'Jacket Waist Suppression', 'Sleeve Shortening', 'Trouser Slimming & Length', 'Lining Repair'],
    deliveryDays: { NORMAL: 5, URGENT: 3, VERY_URGENT: 2, VIP: 1, FESTIVAL: 4 }
  },
  BLAZER: {
    alterations: ['Jacket Shoulder Adjustment', 'Sleeve Adjustment', 'Chest Suppression', 'Button Relocation'],
    deliveryDays: { NORMAL: 4, URGENT: 2, VERY_URGENT: 1, VIP: 1, FESTIVAL: 3 }
  },
  SHERWANI: {
    alterations: ['Full Royal Fitting', 'Chest & Waist Suppression', 'Sleeve Length', 'Churidar Adjustment'],
    deliveryDays: { NORMAL: 6, URGENT: 3, VERY_URGENT: 2, VIP: 1, FESTIVAL: 4 }
  },
  LADIES_WEAR: {
    alterations: ['Blouse / Dress Fitting', 'Neck Deepening', 'Side Seam Fitting', 'Sleeve Alteration', 'Zip / Hook Replacement'],
    deliveryDays: { NORMAL: 4, URGENT: 2, VERY_URGENT: 1, VIP: 0.5, FESTIVAL: 3 }
  },
  REPAIR: {
    alterations: ['Tear / Patch Work', 'Button Fixing', 'Seam Re-stitching', 'Lining Replacement'],
    deliveryDays: { NORMAL: 2, URGENT: 1, VERY_URGENT: 0.5, VIP: 0.25, FESTIVAL: 2 }
  }
};

const PRIORITY_TIERS = [
  { id: 'NORMAL', label: 'Normal (Standard 1.0x)', multiplier: 1 },
  { id: 'URGENT', label: 'Urgent (1.5x)', multiplier: 1.5 },
  { id: 'VERY_URGENT', label: 'Very Urgent (2.0x)', multiplier: 2.0 },
  { id: 'VIP', label: 'VIP Royal (2.5x)', multiplier: 2.5 },
  { id: 'FESTIVAL', label: 'Festival Priority (1.8x)', multiplier: 1.8 }
];

export const ShopDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [prices, setPrices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

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
  const [specialNotes, setSpecialNotes] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [damageImageUrl, setDamageImageUrl] = useState('');

  // Selected Order for Timeline Drawer or Confirmation Slip
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmationOrder, setConfirmationOrder] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, walletRes, custRes, pricesRes, invRes, refRes] = await Promise.all([
        apiClient.get('/dashboards/shop').catch(() => ({ data: {} })),
        orderService.getOrders().catch(() => ({ data: [] })),
        walletService.getWallet().catch(() => ({ data: { balances: {} } })),
        customerService.getCustomers().catch(() => ({ data: [] })),
        apiClient.get('/prices').catch(() => ({ data: [] })),
        invoiceService.getInvoices().catch(() => ({ data: [] })),
        referralService.getTeamTree().catch(() => ({ data: {} }))
      ]);

      setMetrics(dashRes?.data || {});
      setOrders(ordersRes?.data || []);
      setWallet(walletRes?.data || {});
      setCustomers(custRes?.data || []);
      setPrices(pricesRes?.data || []);
      setInvoices(invRes?.data || []);
      setReferralData(refRes?.data || {});
    } catch (err) {
      console.error('Error fetching shop dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update default alteration when garmentType changes
  useEffect(() => {
    const defaultAlterations = GARMENT_CONFIG[garmentType]?.alterations || [];
    if (defaultAlterations.length > 0 && !defaultAlterations.includes(alterationType)) {
      setAlterationType(defaultAlterations[0]);
    }
  }, [garmentType]);

  // Dynamic Price Calculation from PriceMaster
  const calculatedPrice = useMemo(() => {
    const rule = prices.find(p => 
      p.garmentType === garmentType && 
      p.alterationType?.toLowerCase() === alterationType?.toLowerCase()
    );

    if (rule) {
      if (priority === 'URGENT') return rule.urgentPrice || Math.round(rule.normalPrice * 1.5);
      if (priority === 'VERY_URGENT') return rule.veryUrgentPrice || Math.round(rule.normalPrice * 2.0);
      if (priority === 'VIP') return rule.vipPrice || Math.round(rule.normalPrice * 2.5);
      if (priority === 'FESTIVAL') return rule.festivalPrice || Math.round(rule.normalPrice * 1.8);
      return rule.normalPrice || 150;
    }

    // Default baseline if no explicit rule configured
    const base = 150;
    const tier = PRIORITY_TIERS.find(p => p.id === priority);
    return Math.round(base * (tier?.multiplier || 1));
  }, [prices, garmentType, alterationType, priority]);

  // Delivery Date Calculation
  const estimatedDeliveryDate = useMemo(() => {
    const daysConfig = GARMENT_CONFIG[garmentType]?.deliveryDays || { NORMAL: 4, URGENT: 2, VERY_URGENT: 1, VIP: 0.5, FESTIVAL: 3 };
    const daysToAdd = daysConfig[priority] || 3;
    const target = new Date();
    target.setHours(target.getHours() + Math.round(daysToAdd * 24));
    return target;
  }, [garmentType, priority]);

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
          damageNotes: damageNotes || undefined,
          damageImages: damageImageUrl ? [damageImageUrl] : [],
          itemPrice: calculatedPrice
        }],
        priority,
        deliveryDate: estimatedDeliveryDate.toISOString(),
        specialNotes,
        pricing: {
          subtotal: calculatedPrice,
          total: calculatedPrice
        }
      };

      const res = await orderService.createOrder(orderPayload);
      const createdOrder = res?.data;

      setFeedback({ type: 'success', message: `Order ${createdOrder?.orderNumber || 'Created'} placed successfully with dynamic rate ₹${calculatedPrice}!` });
      setConfirmationOrder(createdOrder || { ...orderPayload, orderNumber: 'ORD-PENDING' });
      setModalOpen(false);
      setStep(1);
      setCustomerName('');
      setCustomerMobile('');
      setSpecialNotes('');
      setDamageNotes('');
      setDamageImageUrl('');
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
      if (confirmationOrder?._id === orderId) {
        setConfirmationOrder(prev => ({ ...prev, status: 'PICKUP_REQUESTED' }));
      }
      fetchDashboardData();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to dispatch pickup' });
    }
  };

  const handleCopyReferralLink = (code) => {
    const link = `${window.location.origin}/login?ref=${code || 'SHOP-PARTNER'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const term = orderSearch.toLowerCase();
    return orders.filter(o => 
      o.orderNumber?.toLowerCase().includes(term) ||
      o.customerId?.name?.toLowerCase().includes(term) ||
      o.items?.[0]?.garmentType?.toLowerCase().includes(term) ||
      o.status?.toLowerCase().includes(term)
    );
  }, [orders, orderSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Shop Store Operations</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', color: '#d4af37', fontWeight: 600 }}>
              Retail POS
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
            Capture bespoke customer alterations, monitor live workshop progress, and manage tax invoicing & financials
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={fetchDashboardData}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-gold)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} color="#d4af37" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-gold"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
          >
            <PlusCircle size={15} />
            <span>New Bespoke Order</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Orders</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem' }}>{metrics?.todayOrders || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Captured in POS</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending Pickup</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.3rem' }}>{metrics?.pending || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Waiting for fleet</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>In Workshop Craft</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>{metrics?.inProgress || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Active with tailors</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ready for Delivery</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{metrics?.ready || 0}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>QC passed 100%</p>
        </div>
        <div className="erp-card" style={{ padding: '0.9rem 1.1rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Main Wallet</p>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f3e5ab', marginTop: '0.3rem' }}>₹{(wallet?.balances?.main || 0).toLocaleString()}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Available balance</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: activeTab === 'orders' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
            color: activeTab === 'orders' ? '#f3e5ab' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'orders' ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Package size={14} color="#d4af37" /> Store Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            background: activeTab === 'invoices' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
            color: activeTab === 'invoices' ? '#f3e5ab' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'invoices' ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <FileText size={14} color="#d4af37" /> Tax Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('associate')}
          style={{
            background: activeTab === 'associate' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
            color: activeTab === 'associate' ? '#f3e5ab' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'associate' ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Share2 size={14} color="#d4af37" /> 10-Level Associates
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            background: activeTab === 'wallet' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
            color: activeTab === 'wallet' ? '#f3e5ab' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'wallet' ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <CreditCard size={14} color="#d4af37" /> 6-Bucket Wallet
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          style={{
            background: activeTab === 'crm' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
            color: activeTab === 'crm' ? '#f3e5ab' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'crm' ? 'rgba(212, 175, 55, 0.35)' : 'transparent'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Users size={14} color="#d4af37" /> Customer CRM ({customers.length})
        </button>
      </div>

      {/* Tab 1: Orders List */}
      {activeTab === 'orders' && (
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={16} color="#d4af37" />
              <span style={{ fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                Store Orders ({filteredOrders.length})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by order #, customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ padding: '0.35rem 0.65rem 0.35rem 1.75rem', fontSize: '0.75rem', width: '220px' }}
                />
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No orders found matching criteria. Click <strong>"New Bespoke Order"</strong> to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    background: 'rgba(16, 19, 26, 0.75)',
                    border: '1px solid var(--border-gold)',
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
                      <span style={{ fontWeight: 800, color: '#d4af37', fontSize: '0.875rem' }}>
                        {order.orderNumber}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '3px', color: '#f3e5ab' }}>
                        {order.priority}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                      <strong>{order.customerId?.name || 'Customer'}</strong> • {order.items?.[0]?.garmentType} ({order.items?.[0]?.alterations?.type || 'Alteration'})
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Price: ₹{order.pricing?.total || 0} • Est. Delivery: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '3-5 Days'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={order.status} size="sm" />

                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#ffffff', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Eye size={13} color="#d4af37" /> Timeline
                    </button>

                    <button
                      onClick={() => setConfirmationOrder(order)}
                      style={{ background: 'rgba(212, 175, 55, 0.08)', color: '#f3e5ab', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Printer size={13} color="#d4af37" /> Slip
                    </button>

                    {order.status === 'ORDER_CREATED' && (
                      <button
                        onClick={() => handleRequestPickup(order._id)}
                        className="btn-gold"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
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

      {/* Tab 2: Tax Invoices */}
      {activeTab === 'invoices' && (
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="#d4af37" />
              <span style={{ fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                Store Tax Invoices ({invoices.length})
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Official GST Tax Slips & Customer Bills
            </span>
          </div>

          {invoices.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No invoices generated yet. Invoices are auto-created when placing orders or can be generated per order.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Order Ref</th>
                    <th>Subtotal</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td style={{ fontWeight: 700, color: '#d4af37' }}>{inv.invoiceNumber}</td>
                      <td>{inv.customerId?.name || 'Customer'}</td>
                      <td>{inv.orderId?.orderNumber || 'ORD-REF'}</td>
                      <td>₹{inv.subtotal || inv.total}</td>
                      <td style={{ fontWeight: 800, color: '#ffffff' }}>₹{inv.total}</td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          background: inv.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: inv.paymentStatus === 'PAID' ? '#86efac' : '#fde68a',
                          fontWeight: 700
                        }}>
                          {inv.paymentStatus || 'UNPAID'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <a
                          href={`/api/v1/invoices/${inv._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            background: 'rgba(212, 175, 55, 0.12)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '4px',
                            color: '#f3e5ab',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <Printer size={12} /> Print Tax Invoice
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: 10-Level Associates */}
      {activeTab === 'associate' && (
        <div className="erp-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={18} color="#d4af37" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  10-Level Associate Referral Network
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Earn multi-tier commissions up to 10 upline levels whenever referred stores close orders
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 19, 26, 0.9)', border: '1px solid var(--border-gold)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>My Referral Code:</span>
              <span style={{ fontWeight: 800, color: '#d4af37', letterSpacing: '0.05em' }}>
                {referralData?.referralCode || 'SHP-9921'}
              </span>
              <button
                onClick={() => handleCopyReferralLink(referralData?.referralCode)}
                style={{ background: 'transparent', border: 'none', color: copiedLink ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', marginLeft: '0.5rem' }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(16, 19, 26, 0.65)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
              <span style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase' }}>Direct Associates (L1)</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                {referralData?.directCount || 0}
              </h3>
            </div>
            <div style={{ background: 'rgba(16, 19, 26, 0.65)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
              <span style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase' }}>Network Size (10-Level)</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                {referralData?.totalTeamCount || 0}
              </h3>
            </div>
            <div style={{ background: 'rgba(16, 19, 26, 0.65)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
              <span style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase' }}>Commission Earned</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                ₹{(wallet?.balances?.commission || 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 6-Bucket Wallet */}
      {activeTab === 'wallet' && (
        <Wallet6BucketGrid balances={wallet?.balances || {}} onRefresh={fetchDashboardData} />
      )}

      {/* Tab 5: Customer CRM */}
      {activeTab === 'crm' && (
        <div className="erp-card" style={{ padding: '1rem 1.1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', color: '#d4af37' }}>
            <User size={15} color="#d4af37" /> Customer Directory ({customers.length})
          </h3>
          {customers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No customers found in directory.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {customers.map((c) => (
                <div key={c._id} style={{ background: 'rgba(16, 19, 26, 0.75)', border: '1px solid var(--border-gold)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>{c.name}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Phone: {c.mobile}</p>
                  <p style={{ fontSize: '0.7rem', color: '#d4af37', marginTop: '0.15rem' }}>Code: {c.customerCode || 'CST-001'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Timeline Modal Drawer */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d4af37' }}>{selectedOrder.orderNumber}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedOrder.items?.[0]?.garmentType} • {selectedOrder.items?.[0]?.alterations?.type}</p>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setSelectedOrder(null)} />
            </div>

            <OrderTimeline timeline={selectedOrder.timeline || []} />
          </div>
        </div>
      )}

      {/* ORDER CONFIRMATION SLIP MODAL */}
      {confirmationOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '2rem', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #d4af37' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-gold)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 800, letterSpacing: '0.1em' }}>ORDER CONFIRMED</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                  {confirmationOrder.orderNumber}
                </h2>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => setConfirmationOrder(null)} />
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <strong>{confirmationOrder.customerId?.name || customerName || 'Valued Client'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Garment Family:</span>
                <strong>{confirmationOrder.items?.[0]?.garmentType || garmentType}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Alteration Type:</span>
                <span>{confirmationOrder.items?.[0]?.alterations?.type || alterationType}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Priority Tier:</span>
                <span style={{ color: '#d4af37', fontWeight: 700 }}>{confirmationOrder.priority || priority}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Guaranteed Completion:</span>
                <strong style={{ color: '#38bdf8' }}>
                  {new Date(confirmationOrder.deliveryDate || estimatedDeliveryDate).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 700, color: '#f3e5ab' }}>Total Amount:</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#d4af37' }}>
                  ₹{confirmationOrder.pricing?.total || calculatedPrice}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <Printer size={15} /> Print Slip
              </button>

              {confirmationOrder._id && confirmationOrder.status === 'ORDER_CREATED' && (
                <button
                  onClick={() => handleRequestPickup(confirmationOrder._id)}
                  className="btn-gold"
                  style={{ flex: 2, padding: '0.65rem', fontSize: '0.8rem' }}
                >
                  <Truck size={15} /> Request Pickup Now
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DYNAMIC 10-STEP ALTERATION WIZARD MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d4af37' }}>Bespoke Alteration Wizard</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Step {step} of 3 • Price Master Dynamic Rating</p>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => { setModalOpen(false); setStep(1); }} />
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* STEP 1: Customer & Garment Family */}
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
                    className="btn-gold"
                    style={{ padding: '0.65rem', marginTop: '0.25rem' }}
                  >
                    <span>Continue to Alterations & Measurements</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* STEP 2: Alterations, Damage Check & Measurements */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Alteration Operation ({garmentType}) *
                    </label>
                    <select
                      value={alterationType}
                      onChange={(e) => setAlterationType(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-gold)', color: '#ffffff', borderRadius: '4px' }}
                    >
                      {(GARMENT_CONFIG[garmentType]?.alterations || []).map(alt => (
                        <option key={alt} value={alt} style={{ background: '#111827', color: '#ffffff' }}>
                          {alt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 600 }}>
                      Tailor Measurement Tolerances ({garmentType})
                    </label>
                    <MeasurementForm garmentType={garmentType} measurements={measurements} onChange={setMeasurements} />
                  </div>

                  {/* Pre-Work Damage Notes / Photo Check */}
                  <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <span style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: 700 }}>Pre-Existing Fabric Damage Notes</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Note tears, stains, or worn seams before workshop intake..."
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.78rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button type="button" onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem' }}>Back</button>
                    <button type="button" onClick={() => setStep(3)} className="btn-gold" style={{ flex: 2, padding: '0.65rem' }}>
                      <span>Continue to Pricing & Priority</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Priority Tier, Auto-Delivery Calculation & Dynamic Price Preview */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Priority Tier</label>
                    <select 
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value)} 
                      style={{ width: '100%', padding: '0.6rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-gold)', color: '#ffffff', borderRadius: '4px' }}
                    >
                      {PRIORITY_TIERS.map(p => <option key={p.id} value={p.id} style={{ background: '#111827' }}>{p.label}</option>)}
                    </select>
                  </div>

                  {/* Guaranteed Delivery Date Auto-Calculation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px' }}>
                    <Calendar size={18} color="#38bdf8" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#bae6fd', fontWeight: 600 }}>Guaranteed Completion By:</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffffff' }}>
                        {estimatedDeliveryDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Special Notes / Fabric Care</label>
                    <textarea rows={2} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder="Handle delicate silk/wool blend fabric carefully..." style={{ width: '100%', padding: '0.6rem' }} />
                  </div>

                  {/* Real-time Dynamic Price Breakdown */}
                  <div style={{ padding: '0.9rem', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span>Client: <strong>{customerName}</strong> ({customerMobile})</span>
                      <span>Garment: <strong>{garmentType}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      <span>Alteration: <strong>{alterationType}</strong></span>
                      <span>Tier: <strong>{priority}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '0.65rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '0.5rem' }}>
                      <span style={{ color: '#f3e5ab', fontWeight: 700 }}>Price Master Rate:</span>
                      <span style={{ color: '#d4af37', fontWeight: 800, fontSize: '1.2rem' }}>₹{calculatedPrice}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button type="button" onClick={() => setStep(2)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem' }}>Back</button>
                    <button type="submit" disabled={submitting} className="btn-gold" style={{ flex: 2, padding: '0.65rem' }}>
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
