const mongoose = require('mongoose');

const ConsolidatedLotSchema = new mongoose.Schema({
  fpo_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  crop_name: { type: String, required: true, index: true },
  variety: { type: String, required: true },
  total_quantity_metric_tons: { type: Number, required: true },
  expected_price_per_ton_inr: { type: Number, required: true },
  status: { type: String, enum: ['AVAILABLE', 'BIDDED', 'SOLD', 'CONTRACTED'], default: 'AVAILABLE' },
  member_contributions: [{
    farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity_tons: { type: Number, required: true },
    farm_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' }
  }],
  bids: [{
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bid_price_per_ton_inr: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
    created_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ConsolidatedLot', ConsolidatedLotSchema);
