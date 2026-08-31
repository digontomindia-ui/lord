import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true }, // TCK-2026-000001
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  category: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], 
    default: 'OPEN',
    index: true 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

supportTicketSchema.index({ createdBy: 1, status: 1 });

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
