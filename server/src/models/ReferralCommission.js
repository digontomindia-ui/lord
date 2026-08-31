import mongoose from 'mongoose';

const referralCommissionSchema = new mongoose.Schema({
  beneficiaryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  level: { type: Number, required: true, min: 1, max: 10 },
  orderAmount: { type: Number, required: true },
  commissionPercentage: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CREDITED', 'REVERSED'], default: 'CREDITED' }
}, { timestamps: { createdAt: true, updatedAt: false } });

referralCommissionSchema.index({ beneficiaryUserId: 1, createdAt: -1 });

export default mongoose.models.ReferralCommission || mongoose.model('ReferralCommission', referralCommissionSchema);
