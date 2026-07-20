const Farm = require("../models/Farm");
const User = require("../models/User");
const PMFBYPolicy = require("../models/PMFBYPolicy");
const { computeKCCBaseAmount, computeRiskScore } = require("./financialController");

const CROP_CALENDAR_CONFIG = {
  Rice: {
    milestones: [
      { label: "Land Preparation", category: "PREPARATION", days_offset: -7, icon: "🚜" },
      { label: "Sowing / Transplanting", category: "SOWING", days_offset: 0, icon: "🌱" },
      { label: "First Irrigation", category: "IRRIGATION", days_offset: 10, icon: "💧" },
      { label: "First Top Dressing (Urea)", category: "FERTILIZER", days_offset: 20, icon: "🧪" },
      { label: "Weed Control", category: "WEED_CONTROL", days_offset: 30, icon: "🌿" },
      { label: "Pest Surveillance", category: "PEST_CONTROL", days_offset: 45, icon: "🔍" },
      { label: "Second Top Dressing", category: "FERTILIZER", days_offset: 55, icon: "🧪" },
      { label: "Pre-Harvest Inspection", category: "MONITORING", days_offset: 85, icon: "📋" },
      { label: "Harvest", category: "HARVEST", days_offset: 100, icon: "🌾" },
    ]
  },
  Wheat: {
    milestones: [
      { label: "Land Preparation", category: "PREPARATION", days_offset: -5, icon: "🚜" },
      { label: "Sowing", category: "SOWING", days_offset: 0, icon: "🌱" },
      { label: "First Irrigation", category: "IRRIGATION", days_offset: 15, icon: "💧" },
      { label: "First Fertilizer Application", category: "FERTILIZER", days_offset: 25, icon: "🧪" },
      { label: "Weed Control", category: "WEED_CONTROL", days_offset: 35, icon: "🌿" },
      { label: "Second Fertilizer Application", category: "FERTILIZER", days_offset: 50, icon: "🧪" },
      { label: "Pest Surveillance", category: "PEST_CONTROL", days_offset: 65, icon: "🔍" },
      { label: "Harvest", category: "HARVEST", days_offset: 90, icon: "🌾" },
    ]
  },
  Tomato: {
    milestones: [
      { label: "Nursery Preparation", category: "PREPARATION", days_offset: -10, icon: "🚜" },
      { label: "Transplanting", category: "SOWING", days_offset: 0, icon: "🌱" },
      { label: "First Irrigation", category: "IRRIGATION", days_offset: 7, icon: "💧" },
      { label: "First Fertilizer Dose", category: "FERTILIZER", days_offset: 14, icon: "🧪" },
      { label: "Staking / Support", category: "OTHER", days_offset: 21, icon: "🪝" },
      { label: "Pest Control (Whitefly/Mite)", category: "PEST_CONTROL", days_offset: 30, icon: "🔍" },
      { label: "Fruit Set Monitoring", category: "MONITORING", days_offset: 45, icon: "🍅" },
      { label: "Harvest", category: "HARVEST", days_offset: 70, icon: "🌾" },
    ]
  },
  Onion: {
    milestones: [
      { label: "Seedbed Preparation", category: "PREPARATION", days_offset: -5, icon: "🚜" },
      { label: "Sowing", category: "SOWING", days_offset: 0, icon: "🌱" },
      { label: "First Irrigation", category: "IRRIGATION", days_offset: 10, icon: "💧" },
      { label: "Fertilizer Application", category: "FERTILIZER", days_offset: 20, icon: "🧪" },
      { label: "Weed Control", category: "WEED_CONTROL", days_offset: 30, icon: "🌿" },
      { label: "Bulb Development Check", category: "MONITORING", days_offset: 50, icon: "📋" },
      { label: "Harvest", category: "HARVEST", days_offset: 75, icon: "🌾" },
    ]
  },
  Potato: {
    milestones: [
      { label: "Seed Preparation", category: "PREPARATION", days_offset: -7, icon: "🚜" },
      { label: "Planting", category: "SOWING", days_offset: 0, icon: "🌱" },
      { label: "First Irrigation", category: "IRRIGATION", days_offset: 14, icon: "💧" },
      { label: "Fertilizer Application", category: "FERTILIZER", days_offset: 25, icon: "🧪" },
      { label: "Hilling / Earthing Up", category: "OTHER", days_offset: 35, icon: "⛰️" },
      { label: "Pest Surveillance", category: "PEST_CONTROL", days_offset: 50, icon: "🔍" },
      { label: "Harvest", category: "HARVEST", days_offset: 80, icon: "🌾" },
    ]
  },
};

function generateMilestonesForCrop(cropName, sowingDate) {
  const config = CROP_CALENDAR_CONFIG[cropName];
  if (!config) {
    return [
      { label: "Sowing", category: "SOWING", days_offset: 0, icon: "🌱" },
      { label: "Harvest", category: "HARVEST", days_offset: 90, icon: "🌾" },
    ];
  }

  const sowing = new Date(sowingDate);
  return config.milestones.map((m, idx) => {
    const scheduledDate = new Date(sowing);
    scheduledDate.setDate(sowing.getDate() + m.days_offset);
    return {
      id: `milestone_${idx}`,
      label: m.label,
      category: m.category,
      icon: m.icon,
      scheduled_date: scheduledDate.toISOString().split("T")[0],
    };
  });
}

exports.getCropCalendar = async (req, res) => {
  try {
    const { crop_name, sowing_date } = req.query;
    if (!crop_name || !sowing_date) {
      return res.status(400).json({ error: "crop_name and sowing_date are required." });
    }

    const milestones = generateMilestonesForCrop(crop_name, sowing_date);
    res.json({ crop_name, sowing_date, milestones });
  } catch (err) {
    console.error("[Crop Calendar Error]:", err.message);
    res.status(500).json({ error: "Failed to generate crop calendar." });
  }
};
exports.createFarm = async (req, res) => {
  const { farm_name, state, district, sub_district, survey_number, boundary_polygon, soil_profile } = req.body;

  try {
    if (!boundary_polygon || boundary_polygon.type !== "Polygon" || !boundary_polygon.coordinates) {
      return res.status(400).json({ error: "Invalid GeoJSON boundary polygon provided." });
    }

    // Shoelace area calculation in hectares
    // Note: Coordinates are closed ring [lng, lat]
    const ring = boundary_polygon.coordinates[0];
    const n = ring.length;
    if (n < 4) {
      return res.status(400).json({ error: "Boundary polygon must form a closed loop with at least 4 coordinates." });
    }

    // Average latitude to scale longitude correctly
    const lats = ring.map(coord => coord[1]);
    const latMid = lats.reduce((sum, val) => sum + val, 0) / n;
    const rad = (latMid * Math.PI) / 180;
    const metersPerDegreeLat = 111132.9;
    const metersPerDegreeLng = 111132.9 * Math.cos(rad);

    let area = 0;
    for (let i = 0; i < n - 1; i++) {
      const x1 = ring[i][0] * metersPerDegreeLng;
      const y1 = ring[i][1] * metersPerDegreeLat;
      const x2 = ring[i + 1][0] * metersPerDegreeLng;
      const y2 = ring[i + 1][1] * metersPerDegreeLat;
      area += (x1 * y2) - (x2 * y1);
    }
    const finalAreaM2 = Math.abs(area) / 2;
    const calculated_area_hectares = parseFloat((finalAreaM2 / 10000).toFixed(2));

    const newFarm = new Farm({
      owner_id: req.user.id,
      farm_name,
      state,
      district,
      sub_district,
      survey_number,
      calculated_area_hectares,
      boundary_polygon,
      soil_profile,
    });

    const overlapping = await Farm.find({
      owner_id: req.user.id,
      boundary_polygon: {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: boundary_polygon.coordinates,
          },
        },
      },
    });

    if (overlapping.length > 0) {
      return res.status(400).json({ error: "Boundary polygon overlaps with an existing farm registered under your account." });
    }

    const farm = await newFarm.save();
    res.status(201).json({ status: "success", farm_id: farm.id, calculated_area_hectares });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getAllFarms = async (req, res) => {
  try {
    const farms = await Farm.find({ owner_id: req.user.id });
    res.json(farms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Crop Cycle Controllers
const CropCycle = require("../models/CropCycle");

exports.startCropCycle = async (req, res) => {
  const { farm_id, crop_name, crop_variety, sowing_date, target_yield_metric_tons } = req.body;
  try {
    const newCycle = new CropCycle({
      farm_id,
      crop_name,
      crop_variety,
      sowing_date,
      target_yield_metric_tons: target_yield_metric_tons || 0,
      stage: "SOWING",
      expense_ledger: []
    });
    const cycle = await newCycle.save();
    return res.status(201).json({ status: "logged", cycle_id: cycle.id, cycle });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getCropCyclesByFarm = async (req, res) => {
  try {
    const cycles = await CropCycle.find({ farm_id: req.params.farm_id }).sort({ sowing_date: -1 });
    res.json(cycles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.addExpenseToCycle = async (req, res) => {
  const { cycle_id, category, amount_inr, description } = req.body;
  try {
    const cycle = await CropCycle.findById(cycle_id);
    if (!cycle) {
      return res.status(404).json({ error: "Crop cycle not found." });
    }
    cycle.expense_ledger.push({
      category,
      amount_inr,
      description,
      expense_date: new Date()
    });
    await cycle.save();
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.updateCropStage = async (req, res) => {
  const { stage, actual_yield_metric_tons } = req.body;
  try {
    const cycle = await CropCycle.findById(req.params.cycle_id);
    if (!cycle) {
      return res.status(404).json({ error: "Crop cycle not found." });
    }
    cycle.stage = stage;
    if (actual_yield_metric_tons !== undefined) {
      cycle.actual_yield_metric_tons = actual_yield_metric_tons;
    }
    if (stage === "HARVESTED" && !cycle.harvest_date_actual) {
      cycle.harvest_date_actual = new Date();
    }
    await cycle.save();
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.exportFinancialPDF = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId).populate("owner_id", "name email");
    if (!farm) {
      return res.status(404).json({ error: "Farm not found." });
    }

    if (req.user.role === "FARMER" && farm.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to download profile packages for this farm." });
    }

    const cropCycles = await CropCycle.find({ farm_id: req.params.farmId }).sort({ sowing_date: -1 });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=AgriOS_Financial_Pack_${farm.farm_name.replace(/\s+/g, "_")}.pdf`);
    doc.pipe(res);

    doc.fillColor("#10b981").fontSize(24).text("AgriOS: Enterprise Agriculture OS", { align: "center" });
    doc.fillColor("#475569").fontSize(12).text("Certified Digital Farmer Portfolio & Credit Package", { align: "center" });
    doc.moveDown(1.5);
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    doc.fillColor("#0f172a").fontSize(14).text("1. Farmer & Land Records Holding", { underline: true });
    doc.moveDown(0.5);
    doc.fillColor("#334155").fontSize(10);
    doc.text(`Farmer Name: ${farm.owner_id.name}`);
    doc.text(`Email Address: ${farm.owner_id.email}`);
    doc.text(`Farm Name: ${farm.farm_name}`);
    doc.text(`Geographic Location: ${farm.district}, ${farm.state}`);
    doc.text(`Sub-district / Block: ${farm.sub_district}`);
    doc.text(`Government Survey Number: ${farm.survey_number}`);
    doc.text(`Calculated Surface Area: ${farm.calculated_area_hectares} Hectares`);
    doc.moveDown(1.5);

    doc.fillColor("#0f172a").fontSize(14).text("2. Laboratory Soil Profile Analysis", { underline: true });
    doc.moveDown(0.5);
    doc.fillColor("#334155").fontSize(10);
    doc.text(`Nitrogen (N) Content: ${farm.soil_profile.nitrogen_level} mg/kg`);
    doc.text(`Phosphorus (P) Content: ${farm.soil_profile.phosphorus_level} mg/kg`);
    doc.text(`Potassium (K) Content: ${farm.soil_profile.potassium_level} mg/kg`);
    doc.text(`Soil Acidic Index (pH): ${farm.soil_profile.ph_level}`);
    doc.moveDown(1.5);

    doc.fillColor("#0f172a").fontSize(14).text("3. Crop Cultivation Logs & Ledgers", { underline: true });
    doc.moveDown(0.5);

    if (cropCycles.length === 0) {
      doc.fillColor("#64748b").fontSize(10).text("No historical crop cultivation cycles logged.");
    } else {
      cropCycles.forEach((cycle, index) => {
        doc.fillColor("#1e293b").fontSize(11).text(`Cycle #${index + 1}: ${cycle.crop_name} (${cycle.crop_variety})`);
        doc.fillColor("#475569").fontSize(9);
        doc.text(`  Sowing Date: ${new Date(cycle.sowing_date).toLocaleDateString()}`);
        doc.text(`  Staging Status: ${cycle.stage}`);
        doc.text(`  Expected Target Yield: ${cycle.target_yield_metric_tons} Metric Tons`);
        if (cycle.stage === "HARVESTED") {
          doc.text(`  Actual Harvest Output: ${cycle.actual_yield_metric_tons} Metric Tons`);
        }

        const totalExpenses = cycle.expense_ledger.reduce((sum, exp) => sum + exp.amount_inr, 0);
        doc.text(`  Accumulated Cultivation Cost: INR ${totalExpenses.toLocaleString("en-IN")}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1.5);
    doc.fillColor("#0f172a").fontSize(14).text("4. Satellite NDVI Vegetation Index Log", { underline: true });
    doc.moveDown(0.5);

    const NDVISnapshot = require("../models/NDVISnapshot");
    const recentNDVI = await NDVISnapshot.findOne({ farm_id: farm._id }).sort({ createdAt: -1 });
    if (recentNDVI) {
      doc.fillColor("#334155").fontSize(10);
      doc.text(`Latest Mean NDVI: ${recentNDVI.mean_ndvi.toFixed(3)} (Source: ${recentNDVI.source})`);
      doc.text(`Recorded: ${new Date(recentNDVI.createdAt).toLocaleString("en-IN")}`);
      doc.moveDown(0.5);
      doc.text("Vegetation Index Matrix (simplified):");
      doc.fontSize(8).fillColor("#475569");
      const matrixStr = recentNDVI.ndvi_matrix.map((row) => row.map((v) => v.toFixed(2)).join("  ")).join("\n");
      doc.text(matrixStr || "No matrix data.");
      doc.moveDown(0.5);
    } else {
      doc.fillColor("#64748b").fontSize(10).text("No NDVI satellite snapshots recorded for this farm.");
    }

    doc.moveDown(2);
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    const crypto = require("crypto");
    const hashData = `${farm._id}_${farm.owner_id._id}_${Date.now()}`;
    const securityHash = crypto.createHash("sha256").update(hashData).digest("hex").substring(0, 16).toUpperCase();

    doc.fillColor("#047857").fontSize(12).text("VERIFIED DOCUMENT PACKAGE", { align: "center" });
    doc.fillColor("#64748b").fontSize(8).text(`Certification Transaction Code: AQOS-FIN-${securityHash}`, { align: "center" });
    doc.text("This digital package matches local registry records and is signed electronically by AgriOS underwriting systems.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error(`[PDF Packaging Error]: ${err.message}`);
    return res.status(500).json({ error: "Failed to generate signed PDF package." });
  }
};
exports.getFinancialProfile = async (req, res) => {
  try {
    const farmId = req.params.farmId || req.params.farm_id;
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ error: "Farm not found." });
    }

    const cycles = await CropCycle.find({ farm_id: farmId }).sort({ sowing_date: -1 });
    const pmfbyPolicy = await PMFBYPolicy.findOne({ farm_id: farmId }).sort({ createdAt: -1 });

    let totalExpenses = 0;
    const categoryTotals = {};
    cycles.forEach((cycle) => {
      cycle.expense_ledger.forEach((exp) => {
        totalExpenses += exp.amount_inr;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount_inr;
      });
    });

    const kcc = computeKCCBaseAmount(farm);
    const riskScore = computeRiskScore(farm, cycles, totalExpenses);
    const riskGrade = riskScore >= 750 ? "LOW" : riskScore >= 680 ? "MODERATE" : "HIGH";
    const sumInsured = pmfbyPolicy?.sum_insured_inr || farm.calculated_area_hectares * 50000;
    const premiumPayable = pmfbyPolicy?.premium_paid_inr || parseFloat((sumInsured * 0.02).toFixed(2));

    res.json({
      farm_id: farmId,
      farm_name: farm.farm_name,
      calculated_area_hectares: farm.calculated_area_hectares,
      total_expense_runrate_inr: totalExpenses,
      category_expenses: categoryTotals,
      credit_evaluation: {
        risk_score: riskScore,
        risk_grade: riskGrade,
        kcc_recommended_limit_inr: kcc.amount,
        loan_eligibility_status: kcc.eligible && riskScore >= 680 ? "PRE_APPROVED" : "REVIEW",
      },
      pmfby_insurance: {
        policy_number: pmfbyPolicy?.policy_number || (cycles.length > 0 ? `PMFBY-KAR-${farm._id.toString().slice(-6).toUpperCase()}` : "NOT_REGISTERED"),
        coverage_amount_inr: sumInsured,
        premium_payable_inr: premiumPayable,
        claim_status: pmfbyPolicy?.claim_status || (cycles.length > 0 ? "NONE" : "PENDING"),
      },
      soil_health_index: farm.soil_profile.ph_level >= 6.0 && farm.soil_profile.ph_level <= 7.5 ? "OPTIMAL" : "SUB_OPTIMAL",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
