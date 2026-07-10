const mongoose = require("mongoose");

const ConsolidatedLotSchema = new mongoose.Schema({
  fpo_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  crop_name: { type: String, required: true, index: true },
  variety: { type: String, required: true },
  total_quantity_metric_tons: { type: Number, required: true },
  expected_harvest_date: { type: Date, required: true },
  expected_price_per_ton_inr: { type: Number, default: 0 },
  status: { type: String, enum: ["PENDING", "AVAILABLE", "SOLD", "CANCELLED"], default: "PENDING" },
  negotiation_history: [
    {
      business_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      offer_price_per_ton_inr: { type: Number },
      offer_date: { type: Date, default: Date.now },
      status: { type: String, enum: ["OFFERED", "ACCEPTED", "REJECTED"], default: "OFFERED" }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("ConsolidatedLot", ConsolidatedLotSchema);