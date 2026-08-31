import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../shared/apiClient';
import { Users, DollarSign, Activity, Settings, RefreshCw, Shield, Sparkles, Tag } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, priceRes] = await Promise.all([
        apiClient.get('/dashboards/admin').catch(() => ({ data: {} })),
        apiClient.get('/prices').catch(() => ({ data: [] }))
      ]);
      setMetrics(dashRes?.data || {});
      setPrices(priceRes?.data || []);
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>👑 Enterprise Super Admin</h1>
          <p style={{ color: 'var(--text-secondary)' }}>System-wide performance overview, network governance, and price master oversight.</p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
        </button>
      </header>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Enterprise Revenue</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>₹{metrics?.revenue?.total || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registered Stores</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-color)', marginTop: '0.25rem' }}>{metrics?.users?.shops || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Master Workshops</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{metrics?.users?.masters || 0}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Tailors & Fleet</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', marginTop: '0.25rem' }}>{(metrics?.users?.tailors || 0) + (metrics?.users?.deliveryBoys || 0)}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Network Ecosystem Health */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--accent-color)" /> Order Operations Pipeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span>Total Orders Processed:</span>
              <strong style={{ color: 'var(--accent-color)' }}>{metrics?.orders?.total || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span>Orders Placed Today:</span>
              <strong style={{ color: 'var(--warning)' }}>{metrics?.orders?.today || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span>Active Orders Pending:</span>
              <strong style={{ color: '#38bdf8' }}>{metrics?.orders?.pending || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <span>Completed & Closed:</span>
              <strong style={{ color: 'var(--success)' }}>{metrics?.orders?.completed || 0}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Price Master Catalogue Overview */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={20} color="var(--accent-color)" /> Price Master Matrix ({prices.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto' }}>
            {prices.slice(0, 8).map((price) => (
              <div key={price._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                <div>
                  <strong>{price.garmentType}</strong> • {price.alterationType}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{price.normalPrice}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Urgent: ₹{price.urgentPrice})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default SuperAdminDashboard;
