import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SHOP', 'MASTER', 'TAILOR', 'DELIVERY_BOY'], 
    required: true,
    index: true 
  },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  passwordHash: { type: String, required: true },
  profilePhoto: { type: String },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'], 
    default: 'ACTIVE',
    index: true 
  },
  mobileVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  permissions: [{ type: String }],
  
  // Specific embedded profile info
  profile: {
    photo: String,
    address: String,
    city: String,
    state: String,
    pin: String,
    gstNumber: String,
    workshopName: String,
    experience: Number,
    specialization: [String],
    vehicleType: String,
    vehicleNumber: String,
    licenseNumber: String
  },
  
  referralCode: { type: String, unique: true, sparse: true },
  uplineId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
}, { timestamps: true });

userSchema.index({ role: 1, status: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
