const NDVISnapshot = require("../models/NDVISnapshot");
const Farm = require("../models/Farm");

exports.saveSnapshot = async (req, res) => {
  try {
    const { farm_id, mean_ndvi, ndvi_matrix, source, image_type, center_coords } = req.body;

    if (!farm_id || mean_ndvi === undefined || !ndvi_matrix) {
      return res.status(400).json({ error: "farm_id, mean_ndvi, and ndvi_matrix are required." });
    }

    const farm = await Farm.findById(farm_id);
    if (!farm) {
      return res.status(404).json({ error: "Farm not found." });
    }
    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to save NDVI data for this farm." });
    }

    const snapshot = new NDVISnapshot({
      farm_id,
      mean_ndvi: parseFloat(mean_ndvi),
      ndvi_matrix,
      source: source || "Simulated",
      image_type: image_type || "NDVI",
      center_coords: center_coords || null,
    });

    await snapshot.save();
    res.status(201).json({ status: "success", snapshot });
  } catch (err) {
    console.error("[NDVI Snapshot Save Error]:", err.message);
    res.status(500).json({ error: "Failed to save NDVI snapshot." });
  }
};

exports.listSnapshots = async (req, res) => {
  try {
    const { farm_id } = req.query;
    const filter = {};

    if (farm_id) {
      const farm = await Farm.findById(farm_id);
      if (!farm) return res.status(404).json({ error: "Farm not found." });
      if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to access NDVI data for this farm." });
      }
      filter.farm_id = farm_id;
    } else if (req.user.role === "FARMER") {
      const farms = await Farm.find({ owner_id: req.user.id }).select("_id");
      filter.farm_id = { $in: farms.map(f => f._id) };
    }

    const snapshots = await NDVISnapshot.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(snapshots);
  } catch (err) {
    console.error("[NDVI Snapshots List Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch NDVI snapshots." });
  }
};
