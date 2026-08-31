import mongoose from 'mongoose';

const deliveryTaskSchema = new mongoose.Schema({
  deliveryCode: { type: String }, // DEL-2026-000001
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  type: { type: String, enum: ['PICKUP', 'RETURN_DELIVERY'], required: true },
  deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy', index: true },
  from: {
    type: { type: String, enum: ['SHOP', 'WORKSHOP'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    address: { type: String, required: true },
    latitude: Number,
    longitude: Number
  },
  to: {
    type: { type: String, enum: ['SHOP', 'WORKSHOP'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    address: { type: String, required: true },
    latitude: Number,
    longitude: Number
  },
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'ACCEPTED', 'ARRIVED', 'COLLECTED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'FAILED'], 
    default: 'ASSIGNED',
    index: true 
  },
  assignedAt: Date,
  acceptedAt: Date,
  completedAt: Date,
  proof: {
    image: String,
    signature: String,
    otp: String
  }
}, { timestamps: true });

deliveryTaskSchema.index({ deliveryBoyId: 1, status: 1 });

export default mongoose.models.DeliveryTask || mongoose.model('DeliveryTask', deliveryTaskSchema);
