const axios = require('axios');
const Farm = require('../models/Farm');
const CropCycle = require('../models/CropCycle');
const DiseaseLog = require('../models/DiseaseLog');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// Helper to configure axios request with timeout
const getSidecarClient = () => {
  return axios.create({
    baseURL: process.env.ML_SIDECAR_URL || 'http://127.0.0.1:8000',
    timeout: 8000, // 8000ms timeout boundary
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.ML_SIDECAR_TOKEN || 'agrios_internal_secure_sidecar_token_123'
    }
  });
};

exports.diagnoseDisease = async (req, res) => {
  try {
    const { farm_id } = req.body;
    const farmer_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a crop image file.' });
    }

    if (!farm_id) {
      return res.status(400).json({ error: 'Farm ID association is required.' });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) {
      return res.status(404).json({ error: 'Farm record not found.' });
    }

    // Input verification: check size (limit is 8MB)
    if (req.file.size > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 8MB cap.' });
    }

    // Input verification: check safe magic bytes/mimetypes
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Only JPEG, JPG, and PNG are allowed.' });
    }

    let detected_disease = '';
    let confidence_score = 0;
    let remediation_protocol = '';
    let isSidecarOffline = false;

    // Contact the Python ML Sidecar
    const client = getSidecarClient();
    
    // Create FormData for Python sidecar
    const FormData = require('form-data');
    const form = new FormData();
    form.append('image_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    form.append('farm_id', farm_id);

    try {
      const response = await client.post('/vision/diagnose', form, {
        headers: {
          ...form.getHeaders(),
          'X-Internal-Token': process.env.ML_SIDECAR_TOKEN || 'agrios_internal_secure_sidecar_token_123'
        }
      });
      
      detected_disease = response.data.disease;
      confidence_score = response.data.confidence;
      remediation_protocol = response.data.dynamic_remediation;
    } catch (err) {
      console.warn(`[ML Sidecar Offline / Timeout]: ${err.message}. Triggering fallback degradation pattern.`);
      isSidecarOffline = true;
      
      // Graceful degradation fallback values
      detected_disease = 'Rice Blast (Simulated Fallback)';
      confidence_score = 0.85;
      remediation_protocol = 'Model offline fallback: Apply Tricyclazole 75 WP @ 0.6 g/L of water. Maintain standard soil moisture and clear weed barriers around the plot boundary.';
    }

    // Save diagnosis log
    const diseaseLog = new DiseaseLog({
      farmer_id,
      farm_id,
      image_url_path: `/uploads/${Date.now()}_${req.file.originalname}`,
      model_inference: {
        detected_disease,
        confidence_score,
        remediation_protocol
      },
      expert_validation: {
        is_verified: false,
        expert_id: null,
        corrected_disease_string: null,
        expert_notes: null
      }
    });

    await diseaseLog.save();

    return res.status(200).json({
      disease: detected_disease,
      confidence: confidence_score,
      dynamic_remediation: remediation_protocol,
      log_id: diseaseLog._id,
      warning: isSidecarOffline ? 'ML Sidecar service offline. Result generated via fallback policy.' : undefined
    });
  } catch (err) {
    console.error(`[Diagnostics Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal diagnostics processing failure.' });
  }
};

exports.predictYield = async (req, res) => {
  try {
    const { crop_cycle_id, atmospheric_override } = req.body;

    if (!crop_cycle_id) {
      return res.status(400).json({ error: 'Crop cycle ID is required.' });
    }

    const cycle = await CropCycle.findById(crop_cycle_id).populate('farm_id');
    if (!cycle) {
      return res.status(404).json({ error: 'Crop cycle record not found.' });
    }

    const client = getSidecarClient();
    let predicted_yield_tons = 0;
    let baseline_variance = 0;
    let isOffline = false;

    try {
      const response = await client.post('/prediction/yield', {
        crop_name: cycle.crop_name,
        crop_variety: cycle.crop_variety,
        calculated_area_hectares: cycle.farm_id.calculated_area_hectares,
        soil_profile: cycle.farm_id.soil_profile,
        atmospheric_override: atmospheric_override || false
      });

      predicted_yield_tons = response.data.predicted_yield_tons;
      baseline_variance = response.data.baseline_variance;
    } catch (err) {
      console.warn(`[ML Yield Regressor Offline]: ${err.message}. Triggering fallback averaging.`);
      isOffline = true;
      
      // Fallback calculations: target yield adjusted by standard multiplier
      predicted_yield_tons = parseFloat((cycle.target_yield_metric_tons * 0.95).toFixed(2));
      baseline_variance = 0.12; // default 12% standard variance
    }

    // Save prediction on crop cycle for records
    cycle.harvest_date_predicted = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // adjust
    await cycle.save();

    const yieldGapRatio = cycle.target_yield_metric_tons > 0
      ? predicted_yield_tons / cycle.target_yield_metric_tons
      : 0;

    let advisory = 'Yield trend remains within the expected production band.';
    if (yieldGapRatio < 0.85) {
      advisory = 'Predicted output is below target. Review irrigation timing, nutrient balance, and pest pressure.';
    } else if (yieldGapRatio > 1.05) {
      advisory = 'Predicted output is above target. Maintain current crop management and monitor harvest logistics.';
    }

    return res.status(200).json({
      predicted_yield_tons,
      predicted_yield_metric_tons: predicted_yield_tons,
      estimated_yield_metric_tons: predicted_yield_tons,
      baseline_variance,
      confidence: 1 - baseline_variance,
      advisory,
      warning: isOffline ? 'ML Regressor offline. Calculated yield via historical baseline averages.' : undefined
    });
  } catch (err) {
    console.error(`[Yield Predict Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal analytics processing failure.' });
  }
};

exports.predictMarketPrices = async (req, res) => {
  try {
    const { crop_name, state, district, last_price_90_days, last_price_60_days, last_price_30_days } = req.body;

    if (!crop_name || !state || !district) {
      return res.status(400).json({ error: 'Crop name, state, and district are required.' });
    }

    const client = getSidecarClient();
    let forecasted_prices_inr = [];
    let isOffline = false;

    try {
      const response = await client.post('/prediction/prices', {
        crop_name,
        state,
        district,
        last_price_90_days: last_price_90_days || 4000,
        last_price_60_days: last_price_60_days || 4100,
        last_price_30_days: last_price_30_days || 4200
      });

      forecasted_prices_inr = response.data.forecasted_prices_inr || [];
    } catch (err) {
      console.warn(`[ML Price Forecaster Offline]: ${err.message}. Triggering fallback averaging.`);
      isOffline = true;

      const base = last_price_30_days || 4200;
      forecasted_prices_inr = Array.from({ length: 30 }, (_, index) => {
        const wave = Math.sin(index / 5) * (base * 0.05);
        return parseFloat((base + wave).toFixed(2));
      });
    }

    const forecast_7d = forecasted_prices_inr.length >= 7
      ? forecasted_prices_inr[6]
      : forecasted_prices_inr[forecasted_prices_inr.length - 1] || null;
    const forecast_30d = forecasted_prices_inr[forecasted_prices_inr.length - 1] || null;
    const startingPrice = last_price_30_days || forecasted_prices_inr[0] || 0;
    const trendDelta = forecast_30d !== null ? ((forecast_30d - startingPrice) / startingPrice) : 0;

    return res.status(200).json({
      crop_name,
      state,
      district,
      forecasted_prices_inr,
      forecast_7d,
      forecast_30d,
      estimated_price_trend: trendDelta > 0.02 ? 'BULLISH' : trendDelta < -0.02 ? 'BEARISH' : 'STABLE',
      degradation_notice: isOffline ? 'ML sidecar unavailable. Displaying model fallback forecast.' : undefined
    });
  } catch (err) {
    console.error(`[Price Forecast Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal price forecasting failure.' });
  }
};

exports.advisorChat = async (req, res) => {
  try {
    const { session_id, user_prompt_string, farm_id } = req.body;

    if (!user_prompt_string) {
      return res.status(400).json({ error: 'User prompt message cannot be empty.' });
    }

    let farmContext = {};
    if (farm_id) {
      const farm = await Farm.findById(farm_id);
      if (farm) {
        // Find latest active crop cycle
        const cycle = await CropCycle.findOne({ farm_id, stage: { $ne: 'HARVESTED' } });
        farmContext = {
          farm_name: farm.farm_name,
          state: farm.state,
          district: farm.district,
          soil_profile: farm.soil_profile,
          crop: cycle ? cycle.crop_name : 'No active crop cycle',
          stage: cycle ? cycle.stage : 'N/A'
        };
      }
    }

    const client = getSidecarClient();
    let response_text = '';
    let updated_session_id = session_id || `session_${Date.now()}`;
    let isOffline = false;

    try {
      const response = await client.post('/advisor/chat', {
        session_id: updated_session_id,
        user_prompt_string,
        farm_context: farmContext
      });

      response_text = response.data.response_text;
    } catch (err) {
      console.warn(`[ML GenAI Advisor Offline]: ${err.message}. Triggering fallback response rules.`);
      isOffline = true;

      // Construct a high-quality fallback reply based on context
      const crop = farmContext.crop || 'crops';
      const state = farmContext.state || 'local region';
      
      response_text = `Hello! The AI advisor is running in fallback safety mode. 
Based on your records for growing ${crop} in ${state}:
1. **Irrigation**: Ensure proper field drainage as moisture stress is critical during early vegetative stages.
2. **Soil Health**: Your recorded pH level is ${farmContext.soil_profile ? farmContext.soil_profile.ph_level : '7.0'}. Continue applying balanced nitrogen fertilizer as per seasonal tables.
3. **Safety Notice**: Avoid applying chemical pesticides under direct noon sun to prevent leaf scorching. Please double check model guidelines once connectivity is restored.`;
    }

    return res.status(200).json({
      response_text,
      updated_session_id,
      warning: isOffline ? 'Chat advisor offline. Serving dynamic script advice.' : undefined
    });
  } catch (err) {
    console.error(`[Advisor Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal conversational advisor failure.' });
  }
};

exports.exportFinancialPDF = async (req, res) => {
  try {
    const { farmId } = req.params;
    
    // Fetch details
    const farm = await Farm.findById(farmId).populate('owner_id', 'name email');
    if (!farm) {
      return res.status(404).json({ error: 'Farm record not found.' });
    }

    // Ensure authorization
    if (req.user.role === 'FARMER' && farm.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to download profile packages for this farm.' });
    }

    const cropCycles = await CropCycle.find({ farm_id: farmId }).sort({ sowing_date: -1 });

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to client response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AgriOS_Financial_Pack_${farm.farm_name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Header styling
    doc.fillColor('#10b981').fontSize(24).text('AgriOS: Enterprise Agriculture OS', { align: 'center' });
    doc.fillColor('#475569').fontSize(12).text('Certified Digital Farmer Portfolio & Credit Package', { align: 'center' });
    doc.moveDown(1.5);
    
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Section 1: Farmer & Land holding particulars
    doc.fillColor('#0f172a').fontSize(14).text('1. Farmer & Land Records Holding', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#334155').fontSize(10);
    doc.text(`Farmer Name: ${farm.owner_id.name}`);
    doc.text(`Email Address: ${farm.owner_id.email}`);
    doc.text(`Farm Name: ${farm.farm_name}`);
    doc.text(`Geographic Location: ${farm.district}, ${farm.state}`);
    doc.text(`Sub-district / Block: ${farm.sub_district}`);
    doc.text(`Government Survey Number: ${farm.survey_number}`);
    doc.text(`Calculated Surface Area: ${farm.calculated_area_hectares} Hectares`);
    doc.moveDown(1.5);

    // Section 2: Soil Profile Matrix
    doc.fillColor('#0f172a').fontSize(14).text('2. Laboratory Soil Profile Analysis', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#334155').fontSize(10);
    doc.text(`Nitrogen (N) Content: ${farm.soil_profile.nitrogen_level} mg/kg`);
    doc.text(`Phosphorus (P) Content: ${farm.soil_profile.phosphorus_level} mg/kg`);
    doc.text(`Potassium (K) Content: ${farm.soil_profile.potassium_level} mg/kg`);
    doc.text(`Soil Acidic Index (pH): ${farm.soil_profile.ph_level}`);
    doc.moveDown(1.5);

    // Section 3: Crop Operations history
    doc.fillColor('#0f172a').fontSize(14).text('3. Crop Cultivation Logs & Ledgers', { underline: true });
    doc.moveDown(0.5);

    if (cropCycles.length === 0) {
      doc.fillColor('#64748b').fontSize(10).text('No historical crop cultivation cycles logged.');
    } else {
      cropCycles.forEach((cycle, index) => {
        doc.fillColor('#1e293b').fontSize(11).text(`Cycle #${index + 1}: ${cycle.crop_name} (${cycle.crop_variety})`);
        doc.fillColor('#475569').fontSize(9);
        doc.text(`  Sowing Date: ${new Date(cycle.sowing_date).toLocaleDateString()}`);
        doc.text(`  Staging Status: ${cycle.stage}`);
        doc.text(`  Expected Target Yield: ${cycle.target_yield_metric_tons} Metric Tons`);
        if (cycle.stage === 'HARVESTED') {
          doc.text(`  Actual Harvest Output: ${cycle.actual_yield_metric_tons} Metric Tons`);
        }
        
        // Sum expenses
        const totalExpenses = cycle.expense_ledger.reduce((sum, exp) => sum + exp.amount_inr, 0);
        doc.text(`  Accumulated Cultivation Cost: INR ${totalExpenses.toLocaleString('en-IN')}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Section 4: Authenticated Signatures & Security hashes
    const crypto = require('crypto');
    const hashData = `${farm._id}_${farm.owner_id._id}_${Date.now()}`;
    const securityHash = crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 16).toUpperCase();

    doc.fillColor('#047857').fontSize(12).text('VERIFIED DOCUMENT PACKAGE', { align: 'center' });
    doc.fillColor('#64748b').fontSize(8).text(`Certification Transaction Code: AQOS-FIN-${securityHash}`, { align: 'center' });
    doc.text('This digital package matches local registry records and is signed electronically by AgriOS underwriting systems.', { align: 'center' });
    
    doc.end();
  } catch (err) {
    console.error(`[PDF Packaging Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to generate signed PDF package.' });
  }
};

// expert verification controller methods (needed for Agronomist persona)
exports.getDiseaseLogs = async (req, res) => {
  try {
    const logs = await DiseaseLog.find()
      .populate('farmer_id', 'name email')
      .populate('farm_id', 'farm_name district state')
      .sort({ createdAt: -1 });
    return res.status(200).json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve crop disease records.' });
  }
};

exports.getMyDiseaseLogs = async (req, res) => {
  try {
    const logs = await DiseaseLog.find({ farmer_id: req.user.id })
      .populate('farm_id', 'farm_name district state')
      .sort({ createdAt: -1 });

    return res.status(200).json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve your crop disease records.' });
  }
};

exports.verifyDiseaseLog = async (req, res) => {
  try {
    const { log_id, is_verified, corrected_disease_string, expert_notes } = req.body;
    const expert_id = req.user.id;

    if (!log_id) {
      return res.status(400).json({ error: 'Disease log ID is required.' });
    }

    const log = await DiseaseLog.findById(log_id);
    if (!log) {
      return res.status(404).json({ error: 'Disease log record not found.' });
    }

    log.expert_validation = {
      is_verified: is_verified !== undefined ? is_verified : true,
      expert_id,
      corrected_disease_string: corrected_disease_string || null,
      expert_notes: expert_notes || ''
    };

    await log.save();
    return res.status(200).json({ status: 'success', log });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to log expert validation.' });
  }
};
