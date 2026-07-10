const Equipment = require("../models/Equipment");
const Farm = require("../models/Farm");

exports.listEquipment = async (req, res) => {
  try {
    const { farm_id } = req.query;
    const filter = {};
    if (farm_id) {
      if (req.user.role === "FARMER" || req.user.role === "FPO_ADMIN") {
        const farm = await Farm.findById(farm_id);
        if (!farm) return res.status(404).json({ error: "Farm not found." });
        if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
          return res.status(403).json({ error: "Unauthorized to access this farm equipment." });
        }
        filter.farm_id = farm_id;
      } else {
        return res.status(403).json({ error: "Insufficient role permissions." });
      }
    } else if (req.user.role === "FARMER") {
      const farms = await Farm.find({ owner_id: req.user.id }).select("_id");
      filter.farm_id = { $in: farms.map(f => f._id) };
    }

    const equipment = await Equipment.find(filter).sort({ farm_id: 1, equipment_name: 1 });
    res.json(equipment);
  } catch (err) {
    console.error("[Equipment List Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch equipment records." });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const { farm_id, equipment_name, equipment_type, purchase_date, condition_status, notes } = req.body;

    if (!farm_id || !equipment_name || !equipment_type) {
      return res.status(400).json({ error: "farm_id, equipment_name, and equipment_type are required." });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) return res.status(404).json({ error: "Farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to add equipment for this farm." });
    }

    const equipment = new Equipment({
      farm_id,
      equipment_name,
      equipment_type,
      purchase_date: purchase_date ? new Date(purchase_date) : null,
      condition_status: condition_status || "OPERATIONAL",
      notes: notes || null,
    });

    await equipment.save();
    res.status(201).json({ status: "success", equipment });
  } catch (err) {
    console.error("[Equipment Create Error]:", err.message);
    res.status(500).json({ error: "Failed to create equipment record." });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const { equipment_id } = req.params;
    const { condition_status, last_service_date, notes } = req.body;

    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) return res.status(404).json({ error: "Equipment not found." });

    const farm = await Farm.findById(equipment.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this equipment." });
    }

    if (condition_status) equipment.condition_status = condition_status;
    if (last_service_date) {
      equipment.last_service_date = new Date(last_service_date);
      equipment.condition_status = equipment.condition_status === "NEEDS_SERVICE" ? "OPERATIONAL" : equipment.condition_status;
    }
    if (notes !== undefined) equipment.notes = notes;

    await equipment.save();
    res.json({ status: "success", equipment });
  } catch (err) {
    console.error("[Equipment Update Error]:", err.message);
    res.status(500).json({ error: "Failed to update equipment record." });
  }
};

exports.addMaintenanceLog = async (req, res) => {
  try {
    const { equipment_id } = req.params;
    const { description, cost_inr, serviced_by } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Maintenance description is required." });
    }

    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) return res.status(404).json({ error: "Equipment not found." });

    const farm = await Farm.findById(equipment.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to add maintenance log for this equipment." });
    }

    equipment.maintenance_history.push({
      description,
      cost_inr: cost_inr || 0,
      serviced_by: serviced_by || null,
      service_date: new Date(),
    });

    equipment.last_service_date = new Date();
    equipment.condition_status = "OPERATIONAL";

    await equipment.save();
    res.status(201).json({ status: "success", equipment });
  } catch (err) {
    console.error("[Maintenance Log Error]:", err.message);
    res.status(500).json({ error: "Failed to add maintenance log." });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const { equipment_id } = req.params;
    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) return res.status(404).json({ error: "Equipment not found." });

    const farm = await Farm.findById(equipment.farm_id);
    if (!farm) return res.status(404).json({ error: "Associated farm not found." });
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to delete this equipment." });
    }

    await Equipment.findByIdAndDelete(equipment_id);
    res.json({ status: "success", message: "Equipment record deleted." });
  } catch (err) {
    console.error("[Equipment Delete Error]:", err.message);
    res.status(500).json({ error: "Failed to delete equipment record." });
  }
};
