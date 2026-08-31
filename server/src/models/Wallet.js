import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balances: {
    main: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
    todaysWork: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 }
  },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['ACTIVE', 'LOCKED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
