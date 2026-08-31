import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'ORDER_CREATED',
  'PICKUP_REQUESTED',
  'PICKUP_ASSIGNED',
  'PICKUP_ACCEPTED',
  'PICKED_UP',
  'WORKSHOP_RECEIVED',
  'INSPECTION_PENDING',
  'INSPECTION_COMPLETED',
  'TAILOR_ASSIGNED',
  'TAILOR_ACCEPTED',
  'WORK_STARTED',
  'WORK_IN_PROGRESS',
  'WORK_COMPLETED',
  'QC_PENDING',
  'QC_FAILED',
  'REWORK_REQUIRED',
  'QC_APPROVED',
  'READY_FOR_DELIVERY',
  'DELIVERY_ASSIGNED',
  'DELIVERY_ACCEPTED',
  'OUT_FOR_DELIVERY',
  'DELIVERED_TO_SHOP',
  'ORDER_CLOSED',
  'CANCELLED'
];

const orderItemSchema = new mongoose.Schema({
  garmentType: { 
    type: String, 
    enum: ['SHIRT', 'PANT', 'SUIT', 'BLAZER', 'SHERWANI', 'LADIES_WEAR', 'REPAIR'], 
    required: true 
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  alterations: { type: mongoose.Schema.Types.Mixed, required: true },
  measurements: { type: mongoose.Schema.Types.Mixed },
  damageNotes: { type: String },
  damageImages: [{ type: String }],
  specialNotes: { type: String },
  itemPrice: { type: Number, default: 0 }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', index: true },
  tailorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor', index: true },
  pickupDeliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
  returnDeliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
  
  items: [orderItemSchema],
  
  priority: { 
    type: String, 
    enum: ['NORMAL', 'URGENT', 'VERY_URGENT', 'VIP', 'FESTIVAL'], 
    default: 'NORMAL',
    index: true 
  },
  deliveryDate: { type: Date, required: true, index: true },
  status: { 
    type: String, 
    enum: ORDER_STATUSES, 
    default: 'ORDER_CREATED',
    index: true 
  },
  isDelayed: { type: Boolean, default: false, index: true },
  delayReason: { type: String },
  
  pricing: {
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 }
  },
  
  payment: {
    status: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'], default: 'PENDING' },
    paidAmount: { type: Number, default: 0 }
  },
  
  specialNotes: { type: String },
  
  cancellation: {
    reason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date
  }
}, { timestamps: true });

orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1 });
orderSchema.index({ masterId: 1, status: 1 });
orderSchema.index({ tailorId: 1, status: 1 });
orderSchema.index({ deliveryDate: 1, status: 1 });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
