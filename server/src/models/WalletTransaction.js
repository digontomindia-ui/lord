import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  walletType: { 
    type: String, 
    enum: ['MAIN', 'GROWTH', 'TODAYS_WORK', 'REWARD', 'COMMISSION', 'BONUS'], 
    required: true 
  },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  referenceType: { type: String }, // ORDER, WITHDRAWAL, REFERRAL, ADMIN_ADJUSTMENT
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'REVERSED'], default: 'COMPLETED' },
  idempotencyKey: { type: String, unique: true, sparse: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

export default mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
