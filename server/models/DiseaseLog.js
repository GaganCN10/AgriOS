const mongoose = require("mongoose");

const DiseaseLogSchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
  image_url_path: { type: String, required: true },
  model_inference: {
    detected_disease: { type: String, required: true },
    confidence_score: { type: Number, required: true },
    remediation_protocol: { type: String, required: true }
  },
  expert_validation: {
    is_verified: { type: Boolean, default: false },
    expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    corrected_disease_string: { type: String, default: null },
    expert_notes: { type: String, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model("DiseaseLog", DiseaseLogSchema);