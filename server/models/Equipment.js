const mongoose = require("mongoose");

const MaintenanceLogSchema = new mongoose.Schema({
  service_date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  cost_inr: { type: Number, default: 0 },
  serviced_by: { type: String, default: null },
}, { timestamps: true });

const EquipmentSchema = new mongoose.Schema({
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
  equipment_name: { type: String, required: true },
  equipment_type: { type: String, required: true },
  purchase_date: { type: Date, default: null },
  condition_status: { type: String, enum: ["OPERATIONAL", "NEEDS_SERVICE", "RETIRED"], default: "OPERATIONAL" },
  last_service_date: { type: Date, default: null },
  maintenance_history: [MaintenanceLogSchema],
  notes: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Equipment", EquipmentSchema);
