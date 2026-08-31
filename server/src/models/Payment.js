import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  amount: { type: Number, required: true },
  method: { 
    type: String, 
    enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'WALLET', 'OTHER'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], 
    default: 'SUCCESS' 
  },
  transactionReference: String,
  paidAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: true, updatedAt: false } });

paymentSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
