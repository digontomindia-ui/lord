import React from 'react';

const MEASUREMENT_FIELDS = {
  SHIRT: [
    { key: 'chest', label: 'Chest (in)', placeholder: '38' },
    { key: 'waist', label: 'Waist (in)', placeholder: '34' },
    { key: 'shoulder', label: 'Shoulder (in)', placeholder: '17.5' },
    { key: 'sleeve', label: 'Sleeve Length (in)', placeholder: '24' },
    { key: 'neck', label: 'Collar / Neck (in)', placeholder: '15.5' },
    { key: 'length', label: 'Shirt Length (in)', placeholder: '29' }
  ],
  PANT: [
    { key: 'waist', label: 'Waist (in)', placeholder: '32' },
    { key: 'seat', label: 'Hip / Seat (in)', placeholder: '38' },
    { key: 'inseam', label: 'Inseam Length (in)', placeholder: '30' },
    { key: 'outseam', label: 'Outseam Length (in)', placeholder: '40' },
    { key: 'bottom', label: 'Bottom Opening (in)', placeholder: '14' },
    { key: 'thigh', label: 'Thigh (in)', placeholder: '23' }
  ],
  SUIT: [
    { key: 'jacketChest', label: 'Jacket Chest (in)', placeholder: '40' },
    { key: 'jacketWaist', label: 'Jacket Waist (in)', placeholder: '36' },
    { key: 'jacketLength', label: 'Jacket Length (in)', placeholder: '30' },
    { key: 'jacketSleeve', label: 'Jacket Sleeve (in)', placeholder: '25' },
    { key: 'trouserWaist', label: 'Trouser Waist (in)', placeholder: '34' },
    { key: 'trouserInseam', label: 'Trouser Length (in)', placeholder: '31' }
  ],
  BLAZER: [
    { key: 'chest', label: 'Chest (in)', placeholder: '40' },
    { key: 'shoulder', label: 'Shoulder (in)', placeholder: '18' },
    { key: 'sleeve', label: 'Sleeve Length (in)', placeholder: '25' },
    { key: 'waist', label: 'Waist (in)', placeholder: '36' },
    { key: 'length', label: 'Back Length (in)', placeholder: '30' }
  ],
  SHERWANI: [
    { key: 'chest', label: 'Chest (in)', placeholder: '42' },
    { key: 'waist', label: 'Waist (in)', placeholder: '38' },
    { key: 'shoulder', label: 'Shoulder (in)', placeholder: '18.5' },
    { key: 'fullLength', label: 'Full Length (in)', placeholder: '44' },
    { key: 'sleeve', label: 'Sleeve Length (in)', placeholder: '26' },
    { key: 'churidarLength', label: 'Churidar Length (in)', placeholder: '46' }
  ],
  LADIES_WEAR: [
    { key: 'bust', label: 'Bust / Chest (in)', placeholder: '36' },
    { key: 'underbust', label: 'Underbust (in)', placeholder: '30' },
    { key: 'waist', label: 'Waist (in)', placeholder: '28' },
    { key: 'hip', label: 'Hip (in)', placeholder: '38' },
    { key: 'dressLength', label: 'Dress / Blouse Length (in)', placeholder: '36' }
  ],
  REPAIR: [
    { key: 'repairLocation', label: 'Damage Location Description', placeholder: 'Left sleeve elbow tear' },
    { key: 'patchSize', label: 'Patch Size (e.g. 2x2 in)', placeholder: '2x2 in' }
  ]
};

export const MeasurementForm = ({ garmentType = 'SHIRT', measurements = {}, onChange }) => {
  const fields = MEASUREMENT_FIELDS[garmentType] || MEASUREMENT_FIELDS.SHIRT;

  const handleInputChange = (key, value) => {
    onChange({
      ...measurements,
      [key]: value
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
      {fields.map((f) => (
        <div key={f.key}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 500 }}>
            {f.label}
          </label>
          <input
            type="text"
            value={measurements[f.key] || ''}
            onChange={(e) => handleInputChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default MeasurementForm;
