import mongoose from 'mongoose';

const pickupTaskSchema = new mongoose.Schema({
  pickupCode: { type: String }, // PUP-2026-000001
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy', index: true },
  status: { 
    type: String, 
    enum: ['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ARRIVED', 'COMPLETED', 'FAILED', 'CANCELLED'], 
    default: 'REQUESTED',
    index: true 
  },
  quantity: { type: Number, required: true, default: 1 },
  pickupLocation: {
    address: { type: String, required: true },
    latitude: Number,
    longitude: Number
  },
  acceptedAt: Date,
  completedAt: Date,
  otpCode: String,
  notes: String
}, { timestamps: true });

pickupTaskSchema.index({ deliveryBoyId: 1, status: 1 });

export default mongoose.models.PickupTask || mongoose.model('PickupTask', pickupTaskSchema);
