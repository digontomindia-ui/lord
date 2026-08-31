import mongoose from 'mongoose';

const workAssignmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Master', required: true, index: true },
  tailorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor', required: true, index: true },
  assignedAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'ACCEPTED', 'WORKING', 'COMPLETED', 'REWORK'], 
    default: 'ASSIGNED',
    index: true 
  },
  instructions: String,
  estimatedMinutes: Number
}, { timestamps: true });

export default mongoose.models.WorkAssignment || mongoose.model('WorkAssignment', workAssignmentSchema);
