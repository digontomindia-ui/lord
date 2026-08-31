import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  customerCode: { type: String, required: true, uppercase: true }, // e.g. CST-1001
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  address: {
    line1: String,
    city: String,
    state: String,
    pinCode: String
  },
  statistics: {
    totalOrders: { type: Number, default: 0 },
    totalBusiness: { type: Number, default: 0 }
  },
  lastOrderAt: { type: Date }
}, { timestamps: true });

customerSchema.index({ shopId: 1, mobile: 1 }, { unique: true });
customerSchema.index({ shopId: 1, name: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
