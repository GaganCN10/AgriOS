const mongoose = require("mongoose");

const MandiPriceSchema = new mongoose.Schema({
  state: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  last_updated: { type: Date, default: Date.now },
  market_prices: [{
    crop: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model("MandiPrice", MandiPriceSchema);