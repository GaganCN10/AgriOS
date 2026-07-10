const mongoose = require('mongoose');

const FPOMemberSchema = new mongoose.Schema({
  fpo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  affiliated_farms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true }],
  validation_status: { type: String, enum: ['PENDING', 'PASSED', 'FAILED'], default: 'PENDING' },
  validation_notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FPOMember', FPOMemberSchema);
