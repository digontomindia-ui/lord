import React, { useState } from 'react';
import { Wallet, TrendingUp, Scissors, Award, Users, Gift, ArrowUpRight, X, AlertCircle } from 'lucide-react';
import { walletService } from '../../services/apiServices';

const BUCKETS = [
  { key: 'main', label: 'Main Balance', icon: Wallet, color: '#6366f1', desc: 'Liquid available funds' },
  { key: 'growth', label: 'Growth Pool', icon: TrendingUp, color: '#22c55e', desc: 'Compounding reserve' },
  { key: 'todaysWork', label: "Today's Work", icon: Scissors, color: '#38bdf8', desc: 'Daily labor earnings' },
  { key: 'reward', label: 'Reward Points', icon: Award, color: '#eab308', desc: 'Performance milestones' },
  { key: 'commission', label: 'Associate Commission', icon: Users, color: '#a855f7', desc: '10-level network affiliate income' },
  { key: 'bonus', label: 'Festival Bonus', icon: Gift, color: '#ec4899', desc: 'Special promotion payouts' }
];

export const Wallet6BucketGrid = ({ balances = {}, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedWalletType, setSelectedWalletType] = useState('MAIN');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 500) {
      setFeedback({ type: 'error', message: 'Minimum withdrawal amount is ₹500' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await walletService.requestWithdrawal({
        amount: Number(amount),
        walletType: selectedWalletType,
        payoutDetails: { upiId }
      });
      setFeedback({ type: 'success', message: 'Payout request submitted for Super Admin review!' });
      setModalOpen(false);
      setAmount('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Withdrawal request failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header with Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={20} color="var(--accent-color)" /> 6-Bucket Financial Ledger
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <ArrowUpRight size={16} /> Request Withdrawal
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          fontSize: '0.85rem'
        }}>
          {feedback.message}
        </div>
      )}

      {/* 6-Bucket Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {BUCKETS.map((b) => {
          const IconComp = b.icon;
          const val = balances[b.key] || 0;
          return (
            <div
              key={b.key}
              className="glass-panel hover-lift"
              style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {b.label}
                </span>
                <div style={{ padding: '0.4rem', borderRadius: '8px', background: `${b.color}22` }}>
                  <IconComp size={16} color={b.color} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: b.color, letterSpacing: '-0.02em' }}>
                ₹{val.toLocaleString()}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {b.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Withdrawal Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Request Fund Withdrawal</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModalOpen(false)} />
            </div>

            <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Source Bucket</label>
                <select
                  value={selectedWalletType}
                  onChange={(e) => setSelectedWalletType(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                >
                  <option value="MAIN">Main Balance (₹{balances.main || 0})</option>
                  <option value="COMMISSION">Commission Bucket (₹{balances.commission || 0})</option>
                  <option value="TODAYS_WORK">Today's Work Bucket (₹{balances.todaysWork || 0})</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Amount (Min ₹500)</label>
                <input
                  type="number"
                  min="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="e.g. 1000"
                  style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>UPI ID / Bank Account Details</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                  placeholder="e.g. user@okaxis or Bank Account / IFSC"
                  style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
              >
                {submitting ? 'Submitting Request...' : 'Confirm Payout Request'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Wallet6BucketGrid;
