import mongoose from 'mongoose';

const masterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  masterCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. MST-1001
  workshopName: { type: String, required: true },
  experience: { type: Number, default: 0 },
  specialization: [{ type: String }],
  mobile: { type: String, required: true },
  address: {
    line1: { type: String, default: 'Atelier Workshop Address' },
    city: { type: String, default: 'City' },
    state: { type: String, default: 'State' },
    pinCode: { type: String, default: '000000' }
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'INACTIVE'], 
    default: 'PENDING_APPROVAL' 
  },
  performance: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    qcPassed: { type: Number, default: 0 },
    qcFailed: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 100 }
  },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

masterSchema.index({ status: 1 });

export default mongoose.models.Master || mongoose.model('Master', masterSchema);
