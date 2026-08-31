import mongoose from 'mongoose';

const qcRecordSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
  attemptNumber: { type: Number, required: true, default: 1 },
  
  measurementCheck: {
    passed: { type: Boolean, required: true },
    note: String
  },
  fittingCheck: {
    passed: { type: Boolean, required: true },
    note: String
  },
  finishingCheck: {
    passed: { type: Boolean, required: true },
    note: String
  },
  qualityCheck: {
    passed: { type: Boolean, required: true },
    note: String
  },
  
  overallStatus: { type: String, enum: ['PASSED', 'FAILED'], required: true },
  failureReason: String,
  images: [{ type: String }]
}, { timestamps: { createdAt: true, updatedAt: false } });

qcRecordSchema.index({ orderId: 1, attemptNumber: -1 });

export default mongoose.models.QCRecord || mongoose.model('QCRecord', qcRecordSchema);
