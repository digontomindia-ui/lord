import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  level: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.models.Referral || mongoose.model('Referral', referralSchema);
