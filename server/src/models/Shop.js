import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. SHP-1001
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  mobile: { type: String, required: true },
  alternateMobile: { type: String },
  email: { type: String },
  gstNumber: { type: String },
  logo: { type: String },
  address: {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pinCode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], default: 'ACTIVE' },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

shopSchema.index({ status: 1 });

export default mongoose.models.Shop || mongoose.model('Shop', shopSchema);
