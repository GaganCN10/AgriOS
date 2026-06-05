const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  crop_name: { type: String, required: true },
  variety: { type: String, required: true },
  target_price: { type: Number, required: true },
  comparison: { type: String, enum: ['ABOVE', 'BELOW'], default: 'ABOVE' },
  is_triggered: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
