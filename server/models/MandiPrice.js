const mongoose = require('mongoose');

const MandiPriceSchema = new mongoose.Schema({
  state: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  market: { type: String, required: true },
  crop_name: { type: String, required: true, index: true },
  variety: { type: String, required: true },
  min_price: { type: Number, required: true },
  max_price: { type: Number, required: true },
  modal_price: { type: Number, required: true },
  price_date: { type: Date, required: true }
}, { timestamps: true });

MandiPriceSchema.index({ state: 1, district: 1, crop_name: 1 });
module.exports = mongoose.model('MandiPrice', MandiPriceSchema);
