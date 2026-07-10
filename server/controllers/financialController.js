const Farm = require('../models/Farm');
const CropCycle = require('../models/CropCycle');
const PMFBYPolicy = require('../models/PMFBYPolicy');
const PDFDocument = require('pdfkit');

const KisanCreditCardCalculator = (farm) => {
  const MAX_BASE_LOAN = 500000;
  const MIN_LAND_FOR_LOAN = 1;

  if (farm.calculated_area_hectares < MIN_LAND_FOR_LOAN) {
    return { eligible: false, amount: 0, reason: 'Minimum land requirement not met' };
  }

  const creditBase = Math.min(farm.calculated_area_hectares * 40000, MAX_BASE_LOAN);
  const nitrogenFactor = farm.soil_profile.nitrogen_level > 5 ? 1.05 : 1.0;
  const finalCreditAmount = creditBase * nitrogenFactor;

  return {
    eligible: true,
    amount: Math.round(finalCreditAmount),
    reason: 'Qualified based on land and soil fertility',
  };
};

const computeRiskScore = (farm, cycles, totalExpenses) => {
  let score = 650;
  if (cycles.length > 0) score += 50;
  if (farm.calculated_area_hectares > 2.0) score += 40;
  if (totalExpenses > 10000) score += 30;
  return Math.min(850, score);
};

const riskGrade = (score) => {
  if (score >= 750) return 'LOW';
  if (score >= 680) return 'MODERATE';
  return 'HIGH';
};

exports.calculateKCC = async (req, res) => {
  try {
    const { farm_id } = req.body;
    if (!farm_id) {
      return res.status(400).json({ error: 'farm_id is required.' });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found.' });
    }

    if (req.user.role === 'FARMER' && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to evaluate this farm.' });
    }

    const kcc = KisanCreditCardCalculator(farm);
    const cycles = await CropCycle.find({ farm_id });
    const totalExpenses = cycles.reduce(
      (sum, cycle) => sum + cycle.expense_ledger.reduce((acc, exp) => acc + exp.amount_inr, 0),
      0
    );
    const riskScore = computeRiskScore(farm, cycles, totalExpenses);

    return res.json({
      farm_id,
      kcc_eligibility: kcc,
      credit_evaluation: {
        risk_score: riskScore,
        risk_grade: riskGrade(riskScore),
        kcc_recommended_limit_inr: kcc.amount,
        loan_eligibility_status: kcc.eligible && riskScore >= 680 ? 'PRE_APPROVED' : 'REVIEW',
      },
    });
  } catch (err) {
    console.error(`[KCC Calculate Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to compute KCC portfolio.' });
  }
};

exports.bulkCalculateKCC = async (req, res) => {
  try {
    if (req.user.role !== 'FPO_ADMIN') {
      return res.status(403).json({ error: 'Only FPO_ADMIN can run bulk KCC evaluation.' });
    }

    const FPOMember = require('../models/FPOMember');
    const members = await FPOMember.find({ fpo_id: req.user.id }).populate('affiliated_farms');
    const farmIds = members.flatMap(m => (m.affiliated_farms || []).map(f => f._id));
    const farms = await Farm.find({ _id: { $in: farmIds } });

    const results = await Promise.all(
      farms.map(async (farm) => {
        const kcc = KisanCreditCardCalculator(farm);
        const cycles = await CropCycle.find({ farm_id: farm._id });
        const totalExpenses = cycles.reduce(
          (sum, cycle) => sum + cycle.expense_ledger.reduce((acc, exp) => acc + exp.amount_inr, 0),
          0
        );
        const riskScore = computeRiskScore(farm, cycles, totalExpenses);
        return {
          farm_id: farm._id,
          farm_name: farm.farm_name,
          area_hectares: farm.calculated_area_hectares,
          kcc_eligibility: kcc,
          credit_evaluation: {
            risk_score: riskScore,
            risk_grade: riskGrade(riskScore),
            kcc_recommended_limit_inr: kcc.amount,
            loan_eligibility_status: kcc.eligible && riskScore >= 680 ? 'PRE_APPROVED' : 'REVIEW',
          },
        };
      })
    );

    res.json({ fpo_id: req.user.id, count: results.length, evaluations: results });
  } catch (err) {
    console.error(`[Bulk KCC Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to compute bulk KCC portfolio.' });
  }
};

exports.trackPMFBY = async (req, res) => {
  try {
    const {
      farm_id,
      crop_name,
      season,
      sum_insured_inr,
      premium_paid_inr,
      premium_status,
      coverage_start,
      coverage_end,
    } = req.body;

    if (!farm_id || !crop_name || !season || !sum_insured_inr) {
      return res.status(400).json({ error: 'farm_id, crop_name, season, and sum_insured_inr are required.' });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found.' });
    }

    if (req.user.role === 'FARMER' && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to register PMFBY for this farm.' });
    }

    const policyNumber = `PMFBY-${farm.state.slice(0, 3).toUpperCase()}-${farm._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const policy = await PMFBYPolicy.findOneAndUpdate(
      { farm_id, season, crop_name },
      {
        farmer_id: req.user.id,
        farm_id,
        policy_number: policyNumber,
        crop_name,
        season,
        sum_insured_inr,
        premium_paid_inr: premium_paid_inr || 0,
        premium_status: premium_status || (premium_paid_inr > 0 ? 'PAID' : 'PENDING'),
        coverage_start: coverage_start ? new Date(coverage_start) : new Date(),
        coverage_end: coverage_end ? new Date(coverage_end) : new Date(Date.now() + 120 * 86400000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ status: 'success', pmfby_policy: policy });
  } catch (err) {
    console.error(`[PMFBY Track Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to register PMFBY coverage record.' });
  }
};

exports.generateDocumentPackage = async (req, res) => {
  try {
    const { farm_id } = req.params;
    const farm = await Farm.findById(farm_id).populate('owner_id', 'name email');
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found.' });
    }

    if (req.user.role === 'FARMER' && farm.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to download profile packages for this farm.' });
    }

    const cropCycles = await CropCycle.find({ farm_id }).sort({ sowing_date: -1 });
    const pmfbyPolicy = await PMFBYPolicy.findOne({ farm_id }).sort({ createdAt: -1 });
    const kcc = KisanCreditCardCalculator(farm);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=AgriOS_Financial_Pack_${farm.farm_name.replace(/\s+/g, '_')}.pdf`
    );
    doc.pipe(res);

    doc.fillColor('#10b981').fontSize(24).text('AgriOS: Enterprise Agriculture OS', { align: 'center' });
    doc.fillColor('#475569').fontSize(12).text('Certified Digital Farmer Portfolio & Credit Package', { align: 'center' });
    doc.moveDown(1.5);

    doc.fillColor('#0f172a').fontSize(14).text('1. Farmer & Land Records Holding', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#334155').fontSize(10);
    doc.text(`Farmer Name: ${farm.owner_id.name}`);
    doc.text(`Farm Name: ${farm.farm_name}`);
    doc.text(`Location: ${farm.district}, ${farm.state}`);
    doc.text(`Survey Number: ${farm.survey_number}`);
    doc.text(`Calculated Area: ${farm.calculated_area_hectares} Hectares`);
    doc.moveDown(1);

    doc.fillColor('#0f172a').fontSize(14).text('2. KCC Credit Evaluation', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#334155').fontSize(10);
    doc.text(`KCC Recommended Limit: INR ${kcc.amount.toLocaleString('en-IN')}`);
    doc.text(`Eligibility Status: ${kcc.eligible ? 'QUALIFIED' : 'NOT QUALIFIED'}`);
    doc.moveDown(1);

    if (pmfbyPolicy) {
      doc.fillColor('#0f172a').fontSize(14).text('3. PMFBY Insurance Record', { underline: true });
      doc.moveDown(0.5);
      doc.fillColor('#334155').fontSize(10);
      doc.text(`Policy Number: ${pmfbyPolicy.policy_number}`);
      doc.text(`Sum Insured: INR ${pmfbyPolicy.sum_insured_inr.toLocaleString('en-IN')}`);
      doc.text(`Premium Status: ${pmfbyPolicy.premium_status}`);
      doc.text(`Claim Status: ${pmfbyPolicy.claim_status}`);
      doc.moveDown(1);
    }

    doc.fillColor('#0f172a').fontSize(14).text('4. Crop Cultivation Logs', { underline: true });
    doc.moveDown(0.5);
    if (cropCycles.length === 0) {
      doc.fillColor('#64748b').fontSize(10).text('No historical crop cycles logged.');
    } else {
      cropCycles.forEach((cycle, index) => {
        doc.fillColor('#1e293b').fontSize(11).text(`Cycle #${index + 1}: ${cycle.crop_name} (${cycle.crop_variety})`);
        doc.fillColor('#475569').fontSize(9);
        doc.text(`  Stage: ${cycle.stage} | Target Yield: ${cycle.target_yield_metric_tons} MT`);
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (err) {
    console.error(`[Document Package Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to generate signed PDF package.' });
  }
};

module.exports.KisanCreditCardCalculator = KisanCreditCardCalculator;
