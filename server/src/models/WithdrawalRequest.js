import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  amount: { type: Number, required: true, min: 500 },
  payoutDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING'], 
    default: 'PENDING',
    index: true 
  },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote: String,
  processedAt: Date
}, { timestamps: true });

withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
