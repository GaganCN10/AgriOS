const mongoose = require("mongoose");

const FarmSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  farm_name: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  sub_district: { type: String, required: true },
  survey_number: { type: String, required: true },
  calculated_area_hectares: { type: Number, required: true },
  boundary_polygon: {
    type: { type: String, enum: ["Polygon"], required: true },
    coordinates: { type: [[[Number]]], required: true } // GeoJSON formatting
  },
  soil_profile: {
    nitrogen_level: { type: Number, default: 0 },
    phosphorus_level: { type: Number, default: 0 },
    potassium_level: { type: Number, default: 0 },
    ph_level: { type: Number, default: 7.0 }
  }
}, { timestamps: true });

FarmSchema.index({ boundary_polygon: "2dsphere" });
module.exports = mongoose.model("Farm", FarmSchema);