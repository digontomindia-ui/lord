import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  oldData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
