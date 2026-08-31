import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true },
  garmentCondition: { type: String, enum: ['GOOD', 'DAMAGED', 'NEEDS_CONFIRMATION'], default: 'GOOD' },
  damageFound: { type: Boolean, default: false },
  damageImages: [{ type: String }],
  alterationVerified: { type: Boolean, default: true },
  priorityVerified: { type: Boolean, default: true },
  deliveryDateVerified: { type: Boolean, default: true },
  specialNotesVerified: { type: Boolean, default: true },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.Inspection || mongoose.model('Inspection', inspectionSchema);
