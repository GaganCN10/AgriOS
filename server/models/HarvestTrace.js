const mongoose = require("mongoose");

const StorageEnvironmentSchema = new mongoose.Schema({
  temperature_celsius: { type: Number, default: null },
  humidity_percent: { type: Number, default: null },
  ventilation_config: { type: String, enum: ["OPTIMAL", "STANDARD", "LIMITED"], default: "STANDARD" }
});

const QualityGradingSchema = new mongoose.Schema({
  grade: { type: String, enum: ["A", "B", "C", "REJECTED"], default: "B" },
  moisture_percent: { type: Number, min: 0, max: 100, default: null },
  weight_metric_tons: { type: Number, required: true },
  visual_inspection_notes: { type: String, default: null }
});

const HarvestTraceSchema = new mongoose.Schema({
  lot_id: { type: mongoose.Schema.Types.ObjectId, ref: "ConsolidatedLot", required: true, index: true },
  crop_name: { type: String, required: true },
  variety: { type: String, required: true },
  batch_code: { type: String, required: true, unique: true }, // Unique code for physical batch
  handler_name: { type: String, required: true },
  dispatch_date: { type: Date, required: true },
  arrival_date: { type: Date, default: null },
  destination: { type: String, required: true },
  storage_environment: StorageEnvironmentSchema,
  quality_grading: QualityGradingSchema,
  vehicle_number: { type: String, default: null },
  logistics_status: { type: String, enum: ["READY", "DISPATCHED", "IN_TRANSIT", "DELAYED", "RECEIVED", "CANCELLED"], default: "READY" },
  notes: { type: String, default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("HarvestTrace", HarvestTraceSchema);