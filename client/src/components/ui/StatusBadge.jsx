import React from 'react';
import { 
  Clock, CheckCircle, AlertCircle, Scissors, Truck, 
  Package, ShieldCheck, XCircle, RefreshCw, Sparkles 
} from 'lucide-react';

const STATUS_CONFIG = {
  ORDER_CREATED: { label: 'Order Created', bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', icon: Sparkles },
  PICKUP_REQUESTED: { label: 'Pickup Requested', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', icon: Clock },
  PICKUP_ASSIGNED: { label: 'Pickup Assigned', bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8', icon: Truck },
  PICKUP_ACCEPTED: { label: 'Pickup Accepted', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', icon: Truck },
  PICKED_UP: { label: 'Picked Up', bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', icon: Package },
  WORKSHOP_RECEIVED: { label: 'Workshop Received', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', icon: Package },
  INSPECTION_PENDING: { label: 'Inspection Pending', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', icon: Clock },
  INSPECTION_COMPLETED: { label: 'Inspection Done', bg: 'rgba(34, 197, 94, 0.12)', text: '#4ade80', icon: CheckCircle },
  TAILOR_ASSIGNED: { label: 'Tailor Assigned', bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', icon: Scissors },
  TAILOR_ACCEPTED: { label: 'Tailor Accepted', bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8', icon: Scissors },
  WORK_STARTED: { label: 'Work Started', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', icon: Scissors },
  WORK_IN_PROGRESS: { label: 'In Progress', bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', icon: Scissors },
  WORK_COMPLETED: { label: 'Work Completed', bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', icon: CheckCircle },
  QC_PENDING: { label: 'QC Pending', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', icon: ShieldCheck },
  QC_APPROVED: { label: 'QC Approved', bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', icon: ShieldCheck },
  QC_FAILED: { label: 'QC Failed', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', icon: AlertCircle },
  REWORK_REQUIRED: { label: 'Rework Required', bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', icon: RefreshCw },
  READY_FOR_DELIVERY: { label: 'Ready for Delivery', bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', icon: Package },
  DELIVERY_ASSIGNED: { label: 'Delivery Assigned', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', icon: Truck },
  DELIVERY_ACCEPTED: { label: 'Delivery Accepted', bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', icon: Truck },
  DELIVERED_TO_SHOP: { label: 'Delivered to Shop', bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', icon: CheckCircle },
  ORDER_CLOSED: { label: 'Order Closed', bg: 'rgba(34, 197, 94, 0.25)', text: '#22c55e', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', icon: XCircle }
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'rgba(255, 255, 255, 0.05)',
    text: 'var(--text-secondary)',
    icon: Clock
  };

  const IconComponent = config.icon;
  const isSmall = size === 'sm';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isSmall ? '0.25rem' : '0.4rem',
      padding: isSmall ? '0.15rem 0.5rem' : '0.3rem 0.75rem',
      backgroundColor: config.bg,
      color: config.text,
      border: `1px solid ${config.bg.replace(/0\.\d+\)/, '0.4)')}`,
      borderRadius: 'var(--radius-sm)',
      fontSize: isSmall ? '0.7rem' : '0.8rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap'
    }}>
      <IconComponent size={isSmall ? 12 : 14} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
