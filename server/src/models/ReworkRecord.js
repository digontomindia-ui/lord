import mongoose from 'mongoose';

const reworkRecordSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  qcId: { type: mongoose.Schema.Types.ObjectId, ref: 'QCRecord', required: true },
  tailorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor', required: true },
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
  reason: { type: String, required: true },
  instructions: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
  completedAt: Date
}, { timestamps: true });

export default mongoose.models.ReworkRecord || mongoose.model('ReworkRecord', reworkRecordSchema);
