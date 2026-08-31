import mongoose from 'mongoose';

const priceMasterSchema = new mongoose.Schema({
  garmentType: { 
    type: String, 
    enum: ['SHIRT', 'PANT', 'SUIT', 'BLAZER', 'SHERWANI', 'LADIES_WEAR', 'REPAIR'], 
    required: true 
  },
  alterationType: { type: String, required: true, trim: true },
  normalPrice: { type: Number, required: true },
  urgentPrice: { type: Number, required: true },
  veryUrgentPrice: { type: Number, required: true },
  vipPrice: { type: Number, required: true },
  festivalPrice: { type: Number, required: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

priceMasterSchema.index({ garmentType: 1, alterationType: 1 }, { unique: true });

export default mongoose.models.PriceMaster || mongoose.model('PriceMaster', priceMasterSchema);
