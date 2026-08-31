import mongoose from 'mongoose';

const normalizeRole = (val) => {
  if (!val) return 'SHOP';
  const str = String(val).toUpperCase().replace(/\s+/g, '_');
  if (['SUPER_ADMIN', 'SHOP', 'MASTER', 'TAILOR', 'DELIVERY_BOY'].includes(str)) return str;
  if (str === 'ADMIN' || str === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (str === 'DELIVERY' || str === 'DELIVERYBOY') return 'DELIVERY_BOY';
  return 'SHOP';
};

const normalizeStatus = (val) => {
  if (!val) return 'ACTIVE';
  const str = String(val).toUpperCase();
  if (['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'].includes(str)) return str;
  return 'ACTIVE';
};

const userSchema = new mongoose.Schema({
  role: { 
    type: String, 
    set: normalizeRole,
    default: 'SHOP',
    index: true 
  },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  passwordHash: { type: String, required: true },
  profilePhoto: { type: String },
  status: { 
    type: String, 
    set: normalizeStatus,
    default: 'ACTIVE',
    index: true 
  },
  mobileVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  permissions: [{ type: String }],
  
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
