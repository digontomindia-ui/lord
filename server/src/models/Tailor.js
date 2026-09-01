import mongoose from 'mongoose';

const tailorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', index: true },
  tailorCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. TLR-1001
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  experience: { type: Number, default: 0 },
  specialization: [{
    type: String,
    enum: ['SHIRT', 'PANT', 'SUIT', 'BLAZER', 'SHERWANI', 'LADIES_WEAR', 'REPAIR']
  }],
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'INACTIVE'], 
    default: 'PENDING_APPROVAL' 
  },
  performance: {
    totalAssigned: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    averageTimeMinutes: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 100 }
  },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

tailorSchema.index({ masterId: 1, status: 1 });

export default mongoose.models.Tailor || mongoose.model('Tailor', tailorSchema);
