import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'orders_2026', 'invoices_2026', 'pickups_2026', 'deliveries_2026', 'tickets_2026'
  sequence: { type: Number, default: 0 },
  prefix: { type: String, required: true },
  year: { type: Number, required: true }
});

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema);
