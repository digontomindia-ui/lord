import mongoose from 'mongoose';

const workProgressSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  tailorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor', required: true, index: true },
  progress: { type: Number, required: true, enum: [25, 50, 75, 90, 100] },
  note: { type: String },
  images: [{ type: String }]
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.WorkProgress || mongoose.model('WorkProgress', workProgressSchema);
