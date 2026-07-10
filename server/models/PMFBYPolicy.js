const mongoose = require('mongoose');

const PMFBYPolicySchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
  policy_number: { type: String, required: true, unique: true },
  crop_name: { type: String, required: true },
  season: { type: String, enum: ['KHARIF', 'RABI', 'ZAID'], required: true },
  sum_insured_inr: { type: Number, required: true },
  premium_paid_inr: { type: Number, default: 0 },
  premium_status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
  claim_status: { type: String, enum: ['NONE', 'FILED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], default: 'NONE' },
  claim_amount_inr: { type: Number, default: 0 },
  coverage_start: { type: Date, required: true },
  coverage_end: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PMFBYPolicy', PMFBYPolicySchema);
