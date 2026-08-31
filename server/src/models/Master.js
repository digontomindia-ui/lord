import mongoose from 'mongoose';

const masterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  masterCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. MST-1001
  workshopName: { type: String, required: true },
  experience: { type: Number, default: 0 },
  specialization: [{ type: String }],
  mobile: { type: String, required: true },
  address: {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true }
  },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], default: 'ACTIVE' },
  performance: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    qcPassed: { type: Number, default: 0 },
    qcFailed: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 100 }
  }
}, { timestamps: true });

masterSchema.index({ status: 1 });

export default mongoose.models.Master || mongoose.model('Master', masterSchema);
