import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  channel: { type: String, enum: ['IN_APP', 'PUSH', 'SMS', 'EMAIL', 'WHATSAPP'], default: 'IN_APP' },
  read: { type: Boolean, default: false, index: true },
  readAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } });

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
