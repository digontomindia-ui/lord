import mongoose from 'mongoose';

const deliveryBoySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  deliveryBoyCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. DLV-1001
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  vehicle: {
    type: { type: String, enum: ['BIKE', 'SCOOTER', 'CAR', 'OTHER'], default: 'BIKE' },
    number: { type: String, default: 'PENDING' }
  },
  licenseNumber: { type: String, default: 'PENDING' },
  address: {
    line1: { type: String, default: 'Fleet Station Address' },
    city: { type: String, default: 'City' },
    state: { type: String, default: 'State' },
    pinCode: { type: String, default: '000000' }
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'INACTIVE', 'ON_DELIVERY'], 
    default: 'PENDING_APPROVAL' 
  },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

deliveryBoySchema.index({ status: 1 });

export default mongoose.models.DeliveryBoy || mongoose.model('DeliveryBoy', deliveryBoySchema);
