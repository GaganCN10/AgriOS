const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const DiseaseLog = require('../models/DiseaseLog');
const CropCycle = require('../models/CropCycle');
const Farm = require('../models/Farm');
const MandiPrice = require('../models/MandiPrice');
const { isAllowedImage } = require('../config/upload');
const { fetchWeatherByCoords } = require('../services/weatherService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_INTERNAL_TOKEN = process.env.ML_SIDECAR_TOKEN || 'agrios_internal_secure_sidecar_token_123';

const mlHeaders = () => ({
  'X-Internal-Token': ML_INTERNAL_TOKEN,
});

const CROP_CODE_MAP = {
  Rice: 0,
  Wheat: 1,
  Tomato: 2,
  Onion: 3,
  Potato: 4,
};

const REMEDIATION_PROTOCOLS = {
  Healthy: 'No disease detected. Continue standard irrigation and balanced NPK monitoring.',
  'Leaf Blast': 'Apply Tricyclazole 75 WP at 0.6 g/L. Reduce nitrogen top-dressing and improve field drainage.',
  'Brown Spot': 'Spray Propiconazole 25 EC at 1 ml/L. Remove heavily infected leaves and avoid overhead irrigation.',
  'Sheath Rot': 'Apply Validamycin 3 L at 2.5 ml/L. Maintain proper plant spacing and avoid water stagnation.',
};

exports.diagnose = async (req, res) => {
  let uploadedPath = null;
  try {
    const { farm_id } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    uploadedPath = imageFile.path;

    if (!isAllowedImage(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
      return res.status(400).json({ error: 'Uploaded file failed image signature validation.' });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    if (req.user.role === 'FARMER' && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to diagnose this farm.' });
    }

    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(uploadedPath));
      formData.append('farm_id', farm_id);

      const mlResponse = await axios.post(`${ML_SERVICE_URL}/diagnose`, formData, {
        headers: { ...formData.getHeaders(), ...mlHeaders() },
        timeout: 8000,
      });

      const diseaseLog = new DiseaseLog({
        farmer_id: req.user.id,
        farm_id,
        image_url_path: uploadedPath,
        model_inference: {
          detected_disease: mlResponse.data.disease,
          confidence_score: mlResponse.data.confidence,
          remediation_protocol: mlResponse.data.remediation_protocol,
        },
      });
      await diseaseLog.save();

      return res.json({
        disease: mlResponse.data.disease,
        confidence: mlResponse.data.confidence,
        remediation: mlResponse.data.remediation_protocol,
        log_id: diseaseLog._id,
      });
    } catch (mlErr) {
      console.error('ML Service error:', mlErr.message);
      return res.status(503).json({
        error: 'ML service unavailable',
        message: 'Analytics sidecar did not respond within the timeout window.',
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.predictYield = async (req, res) => {
  try {
    const { crop_cycle_id } = req.body;

    const cropCycle = await CropCycle.findById(crop_cycle_id).populate('farm_id');
    if (!cropCycle) {
      return res.status(404).json({ error: 'Crop cycle not found' });
    }

    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/predict-yield`,
        {
          crop_cycle_id,
          farm_data: {
            area: cropCycle.farm_id.calculated_area_hectares,
            soil_profile: cropCycle.farm_id.soil_profile,
            crop_name: cropCycle.crop_name,
          },
        },
        { headers: mlHeaders(), timeout: 8000 }
      );

      return res.json({
        predicted_yield_tons: mlResponse.data.predicted_yield,
        baseline_variance: mlResponse.data.variance,
      });
    } catch (mlErr) {
      console.error('ML Service error:', mlErr.message);
      const fallbackYield = cropCycle.farm_id.calculated_area_hectares * 3.5;
      return res.status(503).json({
        error: 'ML service unavailable',
        degradation_notice: 'Returning historical average yield estimate.',
        predicted_yield_tons: parseFloat(fallbackYield.toFixed(2)),
        baseline_variance: 0.15,
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.predictPrices = async (req, res) => {
  try {
    const {
      crop_name,
      state,
      district,
      last_price_90_days,
      last_price_60_days,
      last_price_30_days,
    } = req.body;

    let p90 = last_price_90_days;
    let p60 = last_price_60_days;
    let p30 = last_price_30_days;

    if (!p30 && state && district) {
      const cached = await MandiPrice.findOne({ state, district }).sort({ last_updated: -1 });
      const cropEntry = cached?.market_prices?.find(
        (entry) => entry.crop.toLowerCase() === (crop_name || '').toLowerCase()
      );
      if (cropEntry) {
        p30 = cropEntry.price;
        p60 = cropEntry.price * 0.98;
        p90 = cropEntry.price * 0.96;
      }
    }

    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/predict-prices`,
        {
          crop_name,
          price_history: { p90, p60, p30 },
        },
        { headers: mlHeaders(), timeout: 8000 }
      );

      return res.json(mlResponse.data);
    } catch (mlErr) {
      console.error('ML Service error:', mlErr.message);
      const base = p30 || 4000;
      const series = Array.from({ length: 30 }, (_, i) => parseFloat((base * (1 + (i * 0.002))).toFixed(2)));
      return res.status(503).json({
        degradation_notice: 'ML sidecar offline. Returning interpolated historical averages.',
        estimated_price_trend: 'STABLE',
        forecast_7d: parseFloat((base * 1.01).toFixed(2)),
        forecast_30d: parseFloat((base * 1.03).toFixed(2)),
        forecasted_prices_inr: series,
        advisory: 'Monitor AGMARKNET listings for live price confirmation.',
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.advisorChat = async (req, res) => {
  try {
    const { session_id, user_prompt_string, farm_id } = req.body;

    let farmContext = null;
    if (farm_id) {
      const farm = await Farm.findById(farm_id);
      const activeCycle = await CropCycle.findOne({
        farm_id,
        stage: { $nin: ['HARVESTED', 'ABANDONED'] },
      }).sort({ sowing_date: -1 });

      if (farm) {
        const coordinates = farm.boundary_polygon.coordinates?.[0];
        let weatherContext = null;
        if (coordinates && coordinates.length > 0) {
          const sumLng = coordinates.reduce((sum, c) => sum + c[0], 0);
          const sumLat = coordinates.reduce((sum, c) => sum + c[1], 0);
          const centerLng = sumLng / coordinates.length;
          const centerLat = sumLat / coordinates.length;
          weatherContext = await fetchWeatherByCoords(centerLat, centerLng);
        }

        farmContext = {
          farm_name: farm.farm_name,
          district: farm.district,
          state: farm.state,
          soil_profile: farm.soil_profile,
          active_crop: activeCycle?.crop_name || null,
          crop_stage: activeCycle?.stage || null,
          weather: weatherContext,
        };
      }
    }

    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/chat`,
        {
          session_id,
          user_prompt: user_prompt_string,
          user_id: req.user.id,
          farm_context: farmContext,
        },
        { headers: mlHeaders(), timeout: 8000 }
      );

      return res.json({
        response_text: mlResponse.data.response_text,
        updated_session_id: mlResponse.data.updated_session_id,
        warning: mlResponse.data.warning || null,
      });
    } catch (mlErr) {
      console.error('ML Service error:', mlErr.message);
      return res.status(503).json({
        error: 'ML service unavailable',
        message: 'GenAI advisor sidecar is temporarily offline.',
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Server error' });
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

exports.getAllDiseaseLogs = async (req, res) => {
  try {
    const logs = await DiseaseLog.find()
      .populate('farmer_id', 'name email')
      .populate('farm_id', 'farm_name district state')
      .sort({ createdAt: -1 });
    return res.status(200).json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve disease logs.' });
  }
};

exports.verifyDiseaseLog = async (req, res) => {
  try {
    const { log_id, is_verified, corrected_disease_string, expert_notes } = req.body;

    if (req.user.role !== 'EXPERT') {
      return res.status(403).json({ error: 'Only verified agronomist experts can validate disease logs.' });
    }

    const log = await DiseaseLog.findById(log_id);
    if (!log) {
      return res.status(404).json({ error: 'Disease log not found.' });
    }

    log.expert_validation = {
      is_verified: Boolean(is_verified),
      expert_id: req.user.id,
      corrected_disease_string: corrected_disease_string || null,
      expert_notes: expert_notes || null,
    };

    await log.save();
    return res.status(200).json({ status: 'success', log });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit expert validation.' });
  }
};

module.exports.CROP_CODE_MAP = CROP_CODE_MAP;
module.exports.REMEDIATION_PROTOCOLS = REMEDIATION_PROTOCOLS;
