const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
  item_name: { type: String, required: true },
  category: { type: String, enum: ["SEEDS", "FERTILIZER", "PESTICIDE", "EQUIPMENT_PART", "OTHER"], required: true },
  quantity_on_hand: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true, default: "units" },
  safety_threshold: { type: Number, default: 0 },
  last_restocked: { type: Date, default: null },
  supplier_name: { type: String, default: null },
  notes: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Inventory", InventorySchema);
