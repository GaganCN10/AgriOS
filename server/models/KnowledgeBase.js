const mongoose = require("mongoose");

const KnowledgeBaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  crop_name: { type: String, required: true, index: true },
  region: { type: String, default: "General" },
  category: { type: String, enum: ["PEST", "DISEASE", "NUTRIENT", "IRRIGATION", "HARVEST", "SOIL", "GENERAL"], required: true },
  content: { type: String, required: true },
  treatment_protocol: { type: String, default: null },
  severity_level: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  is_verified: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("KnowledgeBase", KnowledgeBaseSchema);
