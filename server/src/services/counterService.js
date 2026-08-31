import Counter from '../models/Counter.js';

export const getNextSequence = async (type, prefix) => {
  const currentYear = new Date().getFullYear();
  const counterId = `${type}_${currentYear}`;
  
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { 
      $inc: { sequence: 1 },
      $setOnInsert: { prefix: prefix || type.toUpperCase(), year: currentYear }
    },
    { new: true, upsert: true }
  );

  const seqNumber = String(counter.sequence).padStart(6, '0');
  return `${prefix || counter.prefix}-${currentYear}-${seqNumber}`;
};

export const getNextCode = async (type, prefix, pad = 4) => {
  const counterId = `code_${type}`;
  
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { 
      $inc: { sequence: 1 },
      $setOnInsert: { prefix: prefix || type.toUpperCase(), year: 2026 }
    },
    { new: true, upsert: true }
  );

  const seqNumber = String(1000 + counter.sequence).padStart(pad, '0');
  return `${prefix || counter.prefix}-${seqNumber}`;
};
