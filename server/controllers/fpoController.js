const FPOMember = require("../models/FPOMember");
const Farm = require("../models/Farm");
const User = require("../models/User");

exports.createFPOMember = async (req, res) => {
  try {
    const { fpo_id, farm_ids } = req.body;
    
    if (!fpo_id || !farm_ids || !Array.isArray(farm_ids)) {
      return res.status(400).json({ error: 'FPO ID and array of farm IDs required' });
    }

    const fpoAdmin = await User.findById(fpo_id);
    if (!fpoAdmin || fpoAdmin.role !== 'FPO_ADMIN') {
      return res.status(400).json({ error: 'Invalid FPO Admin ID' });
    }

    const farms = await Farm.find({ '_id': { '$in': farm_ids } });
    if (farms.length !== farm_ids.length) {
      return res.status(400).json({ error: 'One or more farm IDs are invalid' });
    }

    const fpoMember = new FPOMember({
      fpo_id,
      affiliated_farms: farm_ids,
      validation_status: 'PENDING'
    });

    await fpoMember.save();
    
    await Farm.updateMany(
      { '_id': { '$in': farm_ids } },
      { '$set': { fpo_affiliation: fpo_id } }
    );

    res.status(201).json({ 
      status: 'success', 
      fpo_member: fpoMember,
      assigned_farms: farms.length 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.validateFPOMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { validation_status, validation_notes } = req.body;

    if (!['PASSED', 'FAILED'].includes(validation_status)) {
      return res.status(400).json({ error: 'Invalid validation status' });
    }

    const fpoMember = await FPOMember.findByIdAndUpdate(
      id,
      { 
        validation_status, 
        validation_notes: validation_notes || '' 
      },
      { new: true }
    );

    if (!fpoMember) {
      return res.status(404).json({ error: 'FPO Member record not found' });
    }

    await Farm.updateMany(
      { '_id': { '$in': fpoMember.affiliated_farms } },
      { '$set': { validation_status: validation_status.toLowerCase() } }
    );

    res.json({ 
      status: 'success', 
      fpo_member: fpoMember 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllFPOMembers = async (req, res) => {
  try {
    const { fpo_id, status } = req.query;
    
    let query = {};
    if (fpo_id) query.fpo_id = fpo_id;
    if (status) query.validation_status = status.toUpperCase();

    const members = await FPOMember.find(query)
      .populate('fpo_id', 'name email')
      .populate('affiliated_farms', 'farm_name calculated_area_hectares boundary_polygon');

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.assignFarmsToFPO = async (req, res) => {
  try {
    const { fpo_id, farm_ids } = req.body;
    
    let fpoMember = await FPOMember.findOne({ fpo_id });
    
    if (!fpoMember) {
      fpoMember = new FPOMember({
        fpo_id,
        affiliated_farms: farm_ids,
        validation_status: 'PENDING'
      });
    } else {
      const newFarms = farm_ids.filter(id => !fpoMember.affiliated_farms.includes(id));
      fpoMember.affiliated_farms.push(...newFarms);
    }

    await fpoMember.save();

    await Farm.updateMany(
      { '_id': { '$in': farm_ids } },
      { '$set': { fpo_affiliation: fpo_id } }
    );

    res.json({ 
      status: 'success', 
      fpo_member: fpoMember,
      total_farms: fpoMember.affiliated_farms.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getFarmAssignments = async (req, res) => {
  try {
    const { fpo_id } = req.params;
    
    const fpoMember = await FPOMember.findOne({ fpo_id })
      .populate('affiliated_farms', 'farm_name calculated_area_hectares boundary_polygon soil_profile validation_status');

    if (!fpoMember) {
      return res.status(404).json({ error: 'FPO member record not found' });
    }

    res.json({
      fpo_id: fpoMember.fpo_id,
      farms: fpoMember.affiliated_farms,
      total_farms: fpoMember.affiliated_farms.length,
      validation_status: fpoMember.validation_status
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
