import React from 'react';
import { Shirt, Scissors, Layers, Sparkles, Crown, Tag, Activity, Check } from 'lucide-react';

export const GARMENTS = [
  { id: 'SHIRT', name: 'Shirt', icon: Shirt, desc: 'Sleeve, collar, sides fitting & shortening' },
  { id: 'PANT', name: 'Trousers / Pant', icon: Layers, desc: 'Waist, seat, inseam length & leg tapering' },
  { id: 'SUIT', name: 'Two/Three Piece Suit', icon: Sparkles, desc: 'Full jacket tailoring & trouser styling' },
  { id: 'BLAZER', name: 'Blazer / Sport Coat', icon: Tag, desc: 'Shoulder width, chest suppression & sleeves' },
  { id: 'SHERWANI', name: 'Royal Sherwani', icon: Crown, desc: 'Bespoke royal fitting & churidar adjust' },
  { id: 'LADIES_WEAR', name: 'Ladies Dress / Blouse', icon: Activity, desc: 'Side seams, neck depth & custom fitting' },
  { id: 'REPAIR', name: 'Fabric Repair / Patch', icon: Scissors, desc: 'Tear mending, button replacements & zip' }
];

export const GarmentSelector = ({ selected, onSelect }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
      {GARMENTS.map((g) => {
        const isSelected = selected === g.id;
        const IconComponent = g.icon;
        return (
          <div
            key={g.id}
            onClick={() => onSelect(g.id)}
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            {isSelected && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Check size={11} />
              </div>
            )}
            <div style={{ color: isSelected ? 'var(--accent-light)' : 'var(--text-muted)' }}>
              <IconComponent size={22} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
              {g.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              {g.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GarmentSelector;
