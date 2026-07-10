const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  crop_name: { type: String, required: true },
  variety: { type: String, default: "Any" },
  target_price: { type: Number, required: true },
  comparison: { type: String, enum: ["ABOVE", "BELOW"], required: true }, // e.g., 'ABOVE' target price or 'BELOW'
  triggered: { type: Boolean, default: false },
  triggered_date: { type: Date, default: null },
  triggered_price: { type: Number, default: null },
  market: { type: String, default: "Regional" }
}, { timestamps: true });

module.exports = mongoose.model("Alert", AlertSchema);