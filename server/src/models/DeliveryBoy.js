import mongoose from 'mongoose';

const deliveryBoySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  deliveryBoyCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. DLV-1001
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  vehicle: {
    type: { type: String, enum: ['BIKE', 'SCOOTER', 'CAR', 'OTHER'], default: 'BIKE' },
    number: { type: String, required: true }
  },
  licenseNumber: { type: String, required: true },
  address: {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true }
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'ON_DELIVERY'], 
    default: 'ACTIVE' 
  }
}, { timestamps: true });

deliveryBoySchema.index({ status: 1 });

export default mongoose.models.DeliveryBoy || mongoose.model('DeliveryBoy', deliveryBoySchema);
