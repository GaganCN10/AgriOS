const mongoose = require("mongoose");

const TaskAttachmentSchema = new mongoose.Schema({
  file_name: { type: String, default: null },
  file_url: { type: String, default: null },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
  crop_cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: "CropCycle", default: null, index: true },
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", default: null, index: true },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  category: { type: String, enum: ["LABOR", "IRRIGATION", "FERTILIZER", "PEST_CONTROL", "HARVEST", "EQUIPMENT", "OTHER"], required: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
  status: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "PENDING" },
  scheduled_start: { type: Date, default: null },
  scheduled_end: { type: Date, default: null },
  actual_start: { type: Date, default: null },
  actual_end: { type: Date, default: null },
  labor_hours: { type: Number, default: 0 },
  cost_incurred_inr: { type: Number, default: 0 },
  completion_notes: { type: String, default: null },
  attachments: [TaskAttachmentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);
