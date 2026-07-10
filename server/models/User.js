const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['FARMER', 'FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT'],
    default: 'FARMER'
  },
  subscription_tier: { 
    type: String, 
    required: true, 
    enum: ['FREE', 'PREMIUM_GROWER', 'ENTERPRISE_FPO'], 
    default: 'FREE' 
  },
  fpo_affiliation: { type: mongoose.Schema.Types.ObjectId, ref: 'FPO', default: null },
  api_usage_counter: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);