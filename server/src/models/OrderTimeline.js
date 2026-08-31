import mongoose from 'mongoose';

const orderTimelineSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  fromStatus: { type: String },
  toStatus: { type: String, required: true },
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByRole: { type: String, required: true },
  note: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

orderTimelineSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.models.OrderTimeline || mongoose.model('OrderTimeline', orderTimelineSchema);
