const mongoose = require('mongoose');

const HarvestTraceSchema = new mongoose.Schema({
  lot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidatedLot', required: true, index: true },
  crop_name: { type: String, required: true, index: true },
  variety: { type: String, required: true },
  batch_code: { type: String, required: true, unique: true, index: true },
  handler_name: { type: String, required: true },
  dispatch_date: { type: Date, required: true },
  destination: { type: String, required: true },
  logistics_status: { type: String, enum: ['READY', 'DISPATCHED', 'IN_TRANSIT', 'DELAYED', 'RECEIVED'], default: 'READY' },
  storage_environment: {
    temperature_c: { type: Number, default: null },
    humidity_percent: { type: Number, default: null },
    ventilation: { type: String, default: null }
  },
  quality_grading: {
    grade: { type: String, enum: ['A', 'B', 'C', 'REJECTED'], default: 'B' },
    moisture_percent: { type: Number, default: null },
    weight_metric_tons: { type: Number, required: true }
  },
  vehicle_number: { type: String, default: null },
  notes: { type: String, default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('HarvestTrace', HarvestTraceSchema);
