import React, { useState } from 'react';
import { walletService } from '../../services/apiServices';
import { 
  Wallet, TrendingUp, Clock, Gift, Award, ArrowUpRight, 
  Send, RefreshCw, X, ShieldCheck, CreditCard, DollarSign 
} from 'lucide-react';

const BUCKET_METADATA = [
  { key: 'main', label: 'Main Balance', desc: 'Active liquid earnings & settlements', icon: Wallet, color: '#6366f1' },
  { key: 'growth', label: 'Growth Reserve', desc: 'Platform reinvestment & capacity expansion', icon: TrendingUp, color: '#10b981' },
  { key: 'todaysWork', label: 'Today\'s Work', desc: 'Real-time daily job milestone earnings', icon: Clock, color: '#0ea5e9' },
  { key: 'reward', label: 'Loyalty Reward', desc: 'Quality compliance & punctuality credits', icon: Award, color: '#f59e0b' },
  { key: 'commission', label: 'Referral Commission', desc: '10-Level network affiliate yield', icon: Award, color: '#a855f7' },
  { key: 'bonus', label: 'Performance Bonus', desc: 'Seasonal volume & peak turn bonuses', icon: Gift, color: '#ec4899' }
];

export const Wallet6BucketGrid = ({ balances = {}, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [bucket, setBucket] = useState('MAIN');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 500) {
      setFeedback({ type: 'error', message: 'Minimum withdrawal amount is ₹500' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await walletService.requestWithdrawal({
        bucket,
        amount: Number(amount),
        payoutMethod: {
          type: 'UPI',
          details: { upiId }
        }
      });
      setFeedback({ type: 'success', message: 'Withdrawal payout request submitted successfully for approval.' });
      setAmount('');
      setUpiId('');
      if (onRefresh) onRefresh();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Withdrawal request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Wallet Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            6-Bucket Financial Architecture
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>
            Audited financial settlement ledger and payout dispatches
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <ArrowUpRight size={14} /> Request Payout
        </button>
      </div>

      {/* 6-Bucket Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {BUCKET_METADATA.map((b) => {
          const val = balances[b.key] || 0;
          const IconComp = b.icon;
          return (
            <div
              key={b.key}
              className="erp-card"
              style={{
                padding: '0.9rem 1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IconComp size={15} color={b.color} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {b.label}
                  </span>
                </div>
              </div>
              
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                ₹{val.toLocaleString()}
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {b.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payout Withdrawal Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="erp-card" style={{ padding: '1.5rem', maxWidth: '420px', width: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Request Balance Payout</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModalOpen(false)} />
            </div>

            {feedback && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', marginBottom: '1rem', background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)', color: feedback.type === 'success' ? '#86efac' : '#fca5a5', fontSize: '0.78rem' }}>
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleWithdrawalRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Source Bucket</label>
                <select value={bucket} onChange={(e) => setBucket(e.target.value)} style={{ width: '100%', padding: '0.65rem' }}>
                  <option value="MAIN">Main Balance (₹{balances.main || 0})</option>
                  <option value="COMMISSION">Commission Bucket (₹{balances.commission || 0})</option>
                  <option value="TODAYS_WORK">Today's Work Bucket (₹{balances.todaysWork || 0})</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Amount (Min ₹500)</label>
                <input type="number" min={500} value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 1500" style={{ width: '100%', padding: '0.65rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Beneficiary UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} required placeholder="e.g. yourname@okaxis" style={{ width: '100%', padding: '0.65rem' }} />
              </div>

              <button type="submit" disabled={loading} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8125rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem' }}>
                {loading ? 'Submitting...' : 'Confirm Withdrawal Request'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Wallet6BucketGrid;
