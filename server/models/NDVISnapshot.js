const mongoose = require("mongoose");

const NDVISnapshotSchema = new mongoose.Schema({
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
  mean_ndvi: { type: Number, required: true },
  ndvi_matrix: { type: [[Number]], required: true },
  source: { type: String, default: "Simulated" },
  image_type: { type: String, default: "NDVI" },
  center_coords: { type: [Number], default: null },
}, { timestamps: true });

module.exports = mongoose.model("NDVISnapshot", NDVISnapshotSchema);
