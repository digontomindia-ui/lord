import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, index: true }, // INV-2026-000001
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  items: [{ type: mongoose.Schema.Types.Mixed }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  pdfUrl: String,
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

invoiceSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
