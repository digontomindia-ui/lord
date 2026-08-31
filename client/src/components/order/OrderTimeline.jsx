import React from 'react';
import { CheckCircle2, Clock, ArrowDown, User } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

export const OrderTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No timeline events recorded yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
      {/* Vertical Connecting Line */}
      <div style={{
        position: 'absolute',
        top: '12px',
        bottom: '12px',
        left: '6px',
        width: '2px',
        background: 'rgba(255, 255, 255, 0.1)',
        zIndex: 0
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {timeline.map((event, index) => {
          const isLatest = index === timeline.length - 1;
          const dateStr = new Date(event.createdAt).toLocaleDateString();
          const timeStr = new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={event._id || index} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {/* Timeline Bullet Node */}
              <div style={{
                position: 'absolute',
                left: '-1.5rem',
                top: '2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: isLatest ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.2)',
                border: `2px solid ${isLatest ? '#818cf8' : 'rgba(255, 255, 255, 0.4)'}`,
                boxShadow: isLatest ? '0 0 10px var(--accent-color)' : 'none',
                zIndex: 1
              }} />

              {/* Event Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <StatusBadge status={event.toStatus} size="sm" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {dateStr} at {timeStr}
                </span>
              </div>

              {/* Performed By & Notes */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                <User size={13} color="var(--text-muted)" />
                <span>
                  {event.performedByRole || 'System'}
                  {event.performedBy?.name ? ` (${event.performedBy.name})` : ''}
                </span>
              </div>

              {event.note && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  marginTop: '0.25rem'
                }}>
                  💬 {event.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
