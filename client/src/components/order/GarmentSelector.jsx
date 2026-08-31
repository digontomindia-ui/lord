import React from 'react';
import { Shirt, Sparkles, Scissors, Heart, Ruler, Check } from 'lucide-react';

export const GARMENTS = [
  { id: 'SHIRT', name: 'Shirt', icon: '👔', desc: 'Sleeve, collar, sides fitting & shortening' },
  { id: 'PANT', name: 'Trousers / Pant', icon: '👖', desc: 'Waist, seat, inseam length & leg tapering' },
  { id: 'SUIT', name: 'Two/Three Piece Suit', icon: '🤵', desc: 'Full jacket tailoring & trouser styling' },
  { id: 'BLAZER', name: 'Blazer / Sport Coat', icon: '🧥', desc: 'Shoulder width, chest suppression & sleeves' },
  { id: 'SHERWANI', name: 'Royal Sherwani', icon: '👑', desc: 'Bespoke royal fitting & churidar adjust' },
  { id: 'LADIES_WEAR', name: 'Ladies Dress / Blouse', icon: '👗', desc: 'Side seams, neck depth & custom fitting' },
  { id: 'REPAIR', name: 'Fabric Repair / Patch', icon: '🧵', desc: 'Tear mending, button replacements & zip' }
];

export const GarmentSelector = ({ selected, onSelect }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
      {GARMENTS.map((g) => {
        const isSelected = selected === g.id;
        return (
          <div
            key={g.id}
            onClick={() => onSelect(g.id)}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: `1.5px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            className="hover-lift"
          >
            {isSelected && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Check size={12} />
              </div>
            )}
            <div style={{ fontSize: '1.8rem' }}>{g.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'white' : 'var(--text-primary)' }}>
              {g.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
              {g.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GarmentSelector;
