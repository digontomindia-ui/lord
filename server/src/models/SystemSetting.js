import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'referral_tiers', 'company', 'order_rules'
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: String
}, { timestamps: true });

export default mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);
