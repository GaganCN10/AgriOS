const ConsolidatedLot = require('../models/ConsolidatedLot');
const HarvestTrace = require('../models/HarvestTrace');

const buildBatchCode = (lotId) => {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return `BATCH-${lotId.toString().slice(-6).toUpperCase()}-${stamp}`;
};

exports.createTraceRecord = async (req, res) => {
  try {
    const {
      lot_id,
      handler_name,
      dispatch_date,
      destination,
      storage_environment,
      quality_grading,
      vehicle_number,
      notes,
      logistics_status,
    } = req.body;

    if (!lot_id || !handler_name || !dispatch_date || !destination || !quality_grading?.weight_metric_tons) {
      return res.status(400).json({ error: 'Missing traceability parameters.' });
    }

    const lot = await ConsolidatedLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: 'Consolidated lot not found.' });
    }

    const batch_code = buildBatchCode(lot._id);

    const record = new HarvestTrace({
      lot_id: lot._id,
      crop_name: lot.crop_name,
      variety: lot.variety,
      batch_code,
      handler_name,
      dispatch_date: new Date(dispatch_date),
      destination,
      storage_environment: storage_environment || {},
      quality_grading: {
        grade: quality_grading.grade || 'B',
        moisture_percent: quality_grading.moisture_percent,
        weight_metric_tons: quality_grading.weight_metric_tons,
      },
      vehicle_number: vehicle_number || null,
      notes: notes || null,
      logistics_status: logistics_status || 'READY',
      created_by: req.user.id,
    });

    await record.save();
    return res.status(201).json({ status: 'success', trace_record: record });
  } catch (err) {
    console.error(`[Traceability Create Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to create traceability record.' });
  }
};

exports.getTraceRecords = async (req, res) => {
  try {
    const { lot_id } = req.query;
    const filter = lot_id ? { lot_id } : {};

    const records = await HarvestTrace.find(filter)
      .populate('lot_id', 'crop_name variety total_quantity_metric_tons status expected_price_per_ton_inr')
      .populate('created_by', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (err) {
    console.error(`[Traceability Fetch Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to fetch traceability records.' });
  }
};

exports.updateTraceStatus = async (req, res) => {
  try {
    const { trace_id } = req.params;
    const { logistics_status, vehicle_number, destination, notes } = req.body;

    const record = await HarvestTrace.findById(trace_id);
    if (!record) {
      return res.status(404).json({ error: 'Traceability record not found.' });
    }

    if (logistics_status) record.logistics_status = logistics_status;
    if (vehicle_number !== undefined) record.vehicle_number = vehicle_number;
    if (destination !== undefined) record.destination = destination;
    if (notes !== undefined) record.notes = notes;

    await record.save();
    return res.status(200).json({ status: 'success', trace_record: record });
  } catch (err) {
    console.error(`[Traceability Update Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to update logistics status.' });
  }
};
