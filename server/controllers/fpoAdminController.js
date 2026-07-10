const FPOMember = require("../models/FPOMember");
const Farm = require("../models/Farm");
const User = require("../models/User");

exports.listFPOMembers = async (req, res) => {
  try {
    if (req.user.role !== "FPO_ADMIN" && req.user.role !== "EXPERT") {
      return res.status(403).json({ error: "Insufficient role permissions." });
    }

    const members = await FPOMember.find({ fpo_id: req.user.id })
      .populate("affiliated_farms", "farm_name district state calculated_area_hectares")
      .sort({ createdAt: -1 });

    res.json(members);
  } catch (err) {
    console.error("[FPO Members List Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch FPO members." });
  }
};

exports.addMember = async (req, res) => {
  try {
    if (req.user.role !== "FPO_ADMIN") {
      return res.status(403).json({ error: "Only FPO_ADMIN can add members." });
    }

    const { email, farm_ids } = req.body;
    if (!email || !farm_ids || !Array.isArray(farm_ids)) {
      return res.status(400).json({ error: "email and farm_ids (array) are required." });
    }

    const member = await FPOMember.findOneAndUpdate(
      { fpo_id: req.user.id, email },
      {
        fpo_id: req.user.id,
        email,
        affiliated_farms: farm_ids,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ status: "success", member });
  } catch (err) {
    console.error("[FPO Member Add Error]:", err.message);
    res.status(500).json({ error: "Failed to add FPO member." });
  }
};

exports.validateMember = async (req, res) => {
  try {
    if (req.user.role !== "FPO_ADMIN") {
      return res.status(403).json({ error: "Only FPO_ADMIN can validate members." });
    }

    const { member_id } = req.params;
    const { validation_status, validation_notes } = req.body;

    if (!["PASSED", "FAILED"].includes(validation_status)) {
      return res.status(400).json({ error: "validation_status must be PASSED or FAILED." });
    }

    const member = await FPOMember.findById(member_id);
    if (!member) {
      return res.status(404).json({ error: "FPO member not found." });
    }

    if (member.fpo_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to validate this member." });
    }

    member.validation_status = validation_status;
    member.validation_notes = validation_notes || null;
    await member.save();

    res.json({ status: "success", member });
  } catch (err) {
    console.error("[FPO Validation Error]:", err.message);
    res.status(500).json({ error: "Failed to validate FPO member." });
  }
};

exports.removeMember = async (req, res) => {
  try {
    if (req.user.role !== "FPO_ADMIN") {
      return res.status(403).json({ error: "Only FPO_ADMIN can remove members." });
    }

    const { member_id } = req.params;
    const member = await FPOMember.findById(member_id);
    if (!member) {
      return res.status(404).json({ error: "FPO member not found." });
    }

    if (member.fpo_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to remove this member." });
    }

    await FPOMember.findByIdAndDelete(member_id);
    res.json({ status: "success", message: "Member removed successfully." });
  } catch (err) {
    console.error("[FPO Remove Member Error]:", err.message);
    res.status(500).json({ error: "Failed to remove FPO member." });
  }
};
