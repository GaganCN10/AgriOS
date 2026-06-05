const Farm = require('../models/Farm');
const CropCycle = require('../models/CropCycle');

// Helper to calculate polygon surface area in hectares using Shoelace formula
const calculatePolygonHectares = (coordinates) => {
  try {
    // coordinates is an array of rings: [[[lng, lat], [lng, lat], ...]]
    // For calculating area, we take the outer ring (first element)
    const ring = coordinates[0];
    const n = ring.length;
    if (n < 4) return 0; // GeoJSON polygon outer ring needs at least 4 coordinates (closed)

    // Find middle latitude to adjust longitude scaling factor
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
    const hectares = finalAreaM2 / 10000;
    return parseFloat(hectares.toFixed(2));
  } catch (err) {
    console.error(`Area calculation error: ${err.message}`);
    return 1.0; // Return a default fallback if structure is corrupt
  }
};

exports.createFarm = async (req, res) => {
  try {
    const { farm_name, state, district, sub_district, survey_number, boundary_polygon, soil_profile } = req.body;
    const owner_id = req.user.id;

    if (!farm_name || !state || !district || !sub_district || !survey_number || !boundary_polygon) {
      return res.status(400).json({ error: 'Missing required farm parameters.' });
    }

    // Validate GeoJSON Polygon
    if (boundary_polygon.type !== 'Polygon' || !Array.isArray(boundary_polygon.coordinates)) {
      return res.status(400).json({ error: 'Boundary layout must be a valid GeoJSON Polygon.' });
    }

    const coordinates = boundary_polygon.coordinates;
    const outerRing = coordinates[0];

    if (!outerRing || outerRing.length < 4) {
      return res.status(400).json({ error: 'Polygon boundary must form a closed loop with at least 4 coordinate points.' });
    }

    // Check if ring is closed
    const firstPoint = outerRing[0];
    const lastPoint = outerRing[outerRing.length - 1];
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      return res.status(400).json({ error: 'Polygon coordinates ring must be closed (first and last coordinate points must match).' });
    }

    // Calculate dynamic area in hectares
    const calculated_area_hectares = calculatePolygonHectares(coordinates);

    const newFarm = new Farm({
      owner_id,
      farm_name,
      state,
      district,
      sub_district,
      survey_number,
      calculated_area_hectares,
      boundary_polygon,
      soil_profile: soil_profile || { nitrogen_level: 45, phosphorus_level: 18, potassium_level: 24, ph_level: 6.8 }
    });

    await newFarm.save();
    return res.status(201).json({ status: 'success', farm_id: newFarm._id, calculated_area_hectares });
  } catch (err) {
    console.error(`[Create Farm Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal farm logging failures.' });
  }
};

exports.getFarms = async (req, res) => {
  try {
    let query = {};
    
    // Farmers see their own farms, FPO_ADMIN and EXPERT see all farms in system for analysis/coordination
    if (req.user.role === 'FARMER') {
      query.owner_id = req.user.id;
    }

    const farms = await Farm.find(query).populate('owner_id', 'name email role');
    return res.status(200).json(farms);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve farm records.' });
  }
};

exports.getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id).populate('owner_id', 'name email role');
    if (!farm) {
      return res.status(404).json({ error: 'Farm profile not found.' });
    }

    // Ensure Farmer only views their own farm
    if (req.user.role === 'FARMER' && farm.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to access this farm record.' });
    }

    return res.status(200).json(farm);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch farm profile.' });
  }
};

exports.startCropCycle = async (req, res) => {
  try {
    const { farm_id, crop_name, crop_variety, sowing_date, target_yield_metric_tons } = req.body;

    if (!farm_id || !crop_name || !crop_variety || !sowing_date || !target_yield_metric_tons) {
      return res.status(400).json({ error: 'Missing crop cycle details.' });
    }

    // Verify farm ownership
    const farm = await Farm.findById(farm_id);
    if (!farm) {
      return res.status(404).json({ error: 'Farm profile not found.' });
    }

    if (req.user.role === 'FARMER' && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to add crop cycle to this farm.' });
    }

    // Predict harvest date dynamically as sowing date + 120 days (approx 4 months default lifecycle)
    const sowDate = new Date(sowing_date);
    const predictedHarvestDate = new Date(sowDate.getTime() + (120 * 24 * 60 * 60 * 1000));

    const newCycle = new CropCycle({
      farm_id,
      crop_name,
      crop_variety,
      sowing_date: sowDate,
      harvest_date_predicted: predictedHarvestDate,
      target_yield_metric_tons,
      stage: 'SOWING',
      expense_ledger: []
    });

    await newCycle.save();
    return res.status(201).json({ status: 'logged', cycle_id: newCycle._id });
  } catch (err) {
    console.error(`[Start Crop Cycle Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to register crop lifecycle.' });
  }
};

exports.getCropCycles = async (req, res) => {
  try {
    const { farmId } = req.params;
    const cycles = await CropCycle.find({ farm_id: farmId }).sort({ sowing_date: -1 });
    return res.status(200).json(cycles);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve crop cycles.' });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { cycle_id, category, amount_inr, description } = req.body;

    if (!cycle_id || !category || !amount_inr) {
      return res.status(400).json({ error: 'Missing expense parameter entries.' });
    }

    const cycle = await CropCycle.findById(cycle_id);
    if (!cycle) {
      return res.status(404).json({ error: 'Crop cycle record not found.' });
    }

    cycle.expense_ledger.push({
      category,
      amount_inr,
      description,
      expense_date: new Date()
    });

    await cycle.save();
    return res.status(200).json({ status: 'success', expense_ledger: cycle.expense_ledger });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to append expense item.' });
  }
};

exports.updateCropStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, actual_yield_metric_tons } = req.body;

    const cycle = await CropCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({ error: 'Crop cycle record not found.' });
    }

    if (stage) {
      cycle.stage = stage;
      if (stage === 'HARVESTED') {
        cycle.harvest_date_actual = new Date();
        if (actual_yield_metric_tons !== undefined) {
          cycle.actual_yield_metric_tons = actual_yield_metric_tons;
        }
      }
    }

    await cycle.save();
    return res.status(200).json(cycle);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update crop status.' });
  }
};

exports.getFinancialProfile = async (req, res) => {
  try {
    const { farmId } = req.params;

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ error: 'Farm record not found.' });
    }

    const cycles = await CropCycle.find({ farm_id: farmId });

    // Calculate dynamic risk score (300 to 850 credit rating standard)
    let riskScore = 720; // Default baseline

    // pH risk factor check
    if (farm.soil_profile.ph_level < 6.0 || farm.soil_profile.ph_level > 7.5) {
      riskScore -= 60;
    }

    // Nutrient check
    if (farm.soil_profile.nitrogen_level < 30) riskScore -= 40;
    if (farm.soil_profile.phosphorus_level < 15) riskScore -= 30;
    if (farm.soil_profile.potassium_level < 20) riskScore -= 30;

    // Crop failures check
    let cropFailures = 0;
    let successfulCycles = 0;
    let totalExpenses = 0;

    cycles.forEach(c => {
      // Sum expenses
      const cycleExpenses = c.expense_ledger.reduce((sum, item) => sum + item.amount_inr, 0);
      totalExpenses += cycleExpenses;

      if (c.stage === 'ABANDONED') {
        cropFailures++;
        riskScore -= 80;
      } else if (c.stage === 'HARVESTED') {
        successfulCycles++;
        // If yield is under 80% of target
        if (c.actual_yield_metric_tons > 0 && c.actual_yield_metric_tons < c.target_yield_metric_tons * 0.8) {
          riskScore -= 40;
        } else {
          riskScore += 20; // Reward successful target completions
        }
      }
    });

    // Enforce limits
    if (riskScore < 300) riskScore = 300;
    if (riskScore > 850) riskScore = 850;

    // Categorized risk grade
    let riskGrade = 'LOW';
    if (riskScore < 550) riskGrade = 'HIGH';
    else if (riskScore < 700) riskGrade = 'MEDIUM';

    // Kisan Credit Card (KCC) Limit Math
    // Standard limit: INR 62,500 per hectare for general food crops
    const kccLimit = Math.round(farm.calculated_area_hectares * 62500);

    // PMFBY Insurance Calculations
    // Standard Premium: ~2.0% for Kharif / 1.5% for Rabi. Let's assume average 2% premium
    const pmfbyCoverageAmount = Math.round(farm.calculated_area_hectares * 75000);
    const pmfbyPremiumPayable = Math.round(pmfbyCoverageAmount * 0.02);

    return res.status(200).json({
      farm_id: farm._id,
      farm_name: farm.farm_name,
      survey_number: farm.survey_number,
      hectares: farm.calculated_area_hectares,
      soil_profile: farm.soil_profile,
      historical_cycles_count: cycles.length,
      crop_failures: cropFailures,
      total_accumulated_expenses_inr: totalExpenses,
      credit_evaluation: {
        risk_score: riskScore,
        risk_grade: riskGrade,
        kcc_recommended_limit_inr: kccLimit,
        loan_eligibility_status: riskScore >= 550 ? 'APPROVED' : 'REFER_TO_BRANCH'
      },
      pmfby_insurance: {
        policy_number: `PMFBY-2026-${farm.survey_number}-${farm._id.toString().substring(18).toUpperCase()}`,
        coverage_amount_inr: pmfbyCoverageAmount,
        premium_payable_inr: pmfbyPremiumPayable,
        premium_paid_status: 'PAID',
        claim_status: cropFailures > 0 ? 'PROCESSING_PAYOUT' : 'NO_CLAIM_FILED'
      }
    });
  } catch (err) {
    console.error(`[Financial Profile Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to build financial credit profile.' });
  }
};

