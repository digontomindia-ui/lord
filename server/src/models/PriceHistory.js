import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  priceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceMaster', required: true, index: true },
  oldPrice: { type: mongoose.Schema.Types.Mixed, required: true },
  newPrice: { type: mongoose.Schema.Types.Mixed, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.PriceHistory || mongoose.model('PriceHistory', priceHistorySchema);
