const ConsolidatedLot = require("../models/ConsolidatedLot");
const HarvestTrace = require("../models/HarvestTrace");
const User = require("../models/User");

const buildBatchCode = (lotId) => {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `BATCH-${lotId.toString().slice(-6).toUpperCase()}-${stamp}`;
};

const mapLotForClient = (lot) => {
  const obj = lot.toObject ? lot.toObject() : lot;
  return {
    ...obj,
    status: obj.status === 'SOLD' ? 'CONTRACTED' : obj.status,
    bids: (obj.negotiation_history || []).map((entry) => ({
      _id: entry._id,
      buyer_id: entry.business_id?.toString?.() || entry.business_id,
      bid_price_per_ton_inr: entry.offer_price_per_ton_inr,
      status: entry.status,
      offer_date: entry.offer_date,
    })),
  };
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
      return res.status(400).json({ error: "Missing traceability parameters." });
    }

    const lot = await ConsolidatedLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: "Consolidated lot not found." });
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
        grade: quality_grading.grade || "B",
        moisture_percent: quality_grading.moisture_percent,
        weight_metric_tons: quality_grading.weight_metric_tons,
      },
      vehicle_number: vehicle_number || null,
      notes: notes || null,
      logistics_status: logistics_status || "READY",
      created_by: req.user.id,
    });

    await record.save();
    return res.status(201).json({ status: "success", trace_record: record });
  } catch (err) {
    console.error(`[Traceability Create Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to create traceability record." });
  }
};

exports.getTraceRecords = async (req, res) => {
  try {
    const { lot_id } = req.query;
    const filter = lot_id ? { lot_id } : {};

    const records = await HarvestTrace.find(filter)
      .populate("lot_id", "crop_name variety total_quantity_metric_tons status expected_price_per_ton_inr")
      .populate("created_by", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (err) {
    console.error(`[Traceability Fetch Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to fetch traceability records." });
  }
};

exports.updateTraceStatus = async (req, res) => {
  try {
    const { trace_id } = req.params;
    const { logistics_status, vehicle_number, destination, notes, arrival_date } = req.body;

    const record = await HarvestTrace.findById(trace_id);
    if (!record) {
      return res.status(404).json({ error: "Traceability record not found." });
    }

    if (logistics_status) record.logistics_status = logistics_status;
    if (vehicle_number !== undefined) record.vehicle_number = vehicle_number;
    if (destination !== undefined) record.destination = destination;
    if (notes !== undefined) record.notes = notes;
    if (arrival_date) record.arrival_date = new Date(arrival_date);
    if (logistics_status === "RECEIVED" && !record.arrival_date) {
      record.arrival_date = new Date();
    }

    await record.save();
    return res.status(200).json({ status: "success", trace_record: record });
  } catch (err) {
    console.error(`[Traceability Update Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to update logistics status." });
  }
};

exports.updateStorageEnvironment = async (req, res) => {
  try {
    const { trace_id } = req.params;
    const { temperature_celsius, humidity_percent, ventilation_config, notes } = req.body;

    const record = await HarvestTrace.findById(trace_id);
    if (!record) {
      return res.status(404).json({ error: "Traceability record not found." });
    }

    if (temperature_celsius !== undefined) record.storage_environment.temperature_celsius = parseFloat(temperature_celsius);
    if (humidity_percent !== undefined) record.storage_environment.humidity_percent = parseFloat(humidity_percent);
    if (ventilation_config) record.storage_environment.ventilation_config = ventilation_config;
    if (notes !== undefined) record.notes = notes;

    await record.save();
    return res.status(200).json({ status: "success", trace_record: record });
  } catch (err) {
    console.error(`[Storage Environment Update Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to update storage environment." });
  }
};

exports.getDispatchTimeline = async (req, res) => {
  try {
    const { lot_id } = req.params;
    const records = await HarvestTrace.find({ lot_id })
      .populate("created_by", "name email")
      .sort({ createdAt: 1 });

    const timeline = records.map((r) => ({
      timestamp: r.createdAt,
      status: r.logistics_status,
      handler: r.created_by?.name || "System",
      destination: r.destination,
      vehicle_number: r.vehicle_number,
      notes: r.notes,
      storage: r.storage_environment,
      quality: r.quality_grading,
    }));

    return res.status(200).json({ lot_id, timeline });
  } catch (err) {
    console.error(`[Dispatch Timeline Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to fetch dispatch timeline." });
  }
};

exports.createConsolidatedLot = async (req, res) => {
  try {
    const { crop_name, variety, total_quantity_metric_tons, expected_harvest_date, expected_price_per_ton_inr } = req.body;

    if (!crop_name || !variety || !total_quantity_metric_tons) {
      return res.status(400).json({ error: "Missing required fields for consolidated lot." });
    }

    const newLot = new ConsolidatedLot({
      fpo_id: req.user.id,
      crop_name,
      variety,
      total_quantity_metric_tons,
      expected_harvest_date: expected_harvest_date ? new Date(expected_harvest_date) : new Date(Date.now() + 90 * 86400000),
      expected_price_per_ton_inr: expected_price_per_ton_inr || 0,
      status: "AVAILABLE",
    });

    const lot = await newLot.save();
    return res.status(201).json({ status: "success", lot_id: lot.id, lot: mapLotForClient(lot) });
  } catch (err) {
    console.error(`[Consolidated Lot Creation Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to create consolidated lot." });
  }
};

exports.getConsolidatedLots = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "FPO_ADMIN") {
      filter.fpo_id = req.user.id;
    } else if (req.user.role === "AGRI_BUSINESS") {
      filter.status = { $in: ["AVAILABLE", "PENDING", "SOLD"] };
    }

    const lots = await ConsolidatedLot.find(filter)
      .populate("fpo_id", "name email")
      .sort({ expected_harvest_date: 1 });

    return res.status(200).json(lots.map(mapLotForClient));
  } catch (err) {
    console.error(`[Consolidated Lot Fetch Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to fetch consolidated lots." });
  }
};

exports.makePurchaseOffer = async (req, res) => {
  try {
    const lot_id = req.body.lot_id;
    const offer_price_per_ton_inr = req.body.offer_price_per_ton_inr ?? req.body.bid_price_per_ton_inr;

    if (req.user.role !== "AGRI_BUSINESS") {
      return res.status(403).json({ error: "Only Agri-Business users can make purchase offers." });
    }
    if (!lot_id || !offer_price_per_ton_inr) {
      return res.status(400).json({ error: "Lot ID and offer price are required." });
    }

    const lot = await ConsolidatedLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: "Consolidated lot not found." });
    }
    if (lot.status !== "AVAILABLE" && lot.status !== "PENDING") {
      return res.status(400).json({ error: `Lot is not available for offers (status: ${lot.status}).` });
    }

    lot.negotiation_history.push({
      business_id: req.user.id,
      offer_price_per_ton_inr,
      status: "OFFERED",
    });

    await lot.save();
    return res.status(200).json({ status: "offer_placed", lot: mapLotForClient(lot) });
  } catch (err) {
    console.error(`[Purchase Offer Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to make purchase offer." });
  }
};

exports.respondToBid = async (req, res) => {
  req.body.negotiation_id = req.body.negotiation_id || req.body.bid_id;
  req.body.status = req.body.status || (req.body.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED');
  return exports.updateOfferStatus(req, res);
};

exports.updateOfferStatus = async (req, res) => {
  try {
    const { lot_id, negotiation_id, status } = req.body;

    if (req.user.role !== "FPO_ADMIN") {
      return res.status(403).json({ error: "Only FPO Admin can accept/reject offers." });
    }
    if (!lot_id || !negotiation_id || !status || !["ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Lot ID, negotiation ID, and valid status (ACCEPTED/REJECTED) are required." });
    }

    const lot = await ConsolidatedLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: "Consolidated lot not found." });
    }
    if (lot.fpo_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this lot." });
    }

    const negotiation = lot.negotiation_history.id(negotiation_id);
    if (!negotiation) {
      return res.status(404).json({ error: "Negotiation record not found." });
    }

    negotiation.status = status;

    if (status === "ACCEPTED") {
      lot.status = "SOLD";
      lot.expected_price_per_ton_inr = negotiation.offer_price_per_ton_inr; // Lock in the accepted price
      // Optionally, set other offers to REJECTED
      lot.negotiation_history.forEach(offer => {
        if (offer._id.toString() !== negotiation_id) {
          offer.status = "REJECTED";
        }
      });
    }

    await lot.save();
    return res.status(200).json({ status: "success", lot: mapLotForClient(lot) });

  } catch (err) {
    console.error(`[Offer Update Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to update offer status." });
  }
};
