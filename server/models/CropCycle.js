const mongoose = require("mongoose");

const CropCycleSchema = new mongoose.Schema({
  farm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
  crop_name: { type: String, required: true, index: true }, // AGMARKNET standard compliant name
  crop_variety: { type: String, required: true },
  sowing_date: { type: Date, required: true },
  harvest_date_predicted: { type: Date },
  harvest_date_actual: { type: Date, default: null },
  target_yield_metric_tons: { type: Number, required: true },
  actual_yield_metric_tons: { type: Number, default: 0 },
  stage: { 
    type: String, 
    enum: ["SOWING", "VEGETATIVE", "FLOWERING", "MATURITY", "HARVESTED", "ABANDONED"], 
    default: "SOWING" 
  },
  expense_ledger: [{
    expense_date: { type: Date, default: Date.now },
    category: { type: String, enum: ["SEEDS", "FERTILIZER", "LABOR", "IRRIGATION", "FUEL"], required: true },
    amount_inr: { type: Number, required: true },
    description: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model("CropCycle", CropCycleSchema);