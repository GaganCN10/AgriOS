const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");
const { fetchSentinelNDVI, generateSimulatedNDVIResponse } = require("../services/geospatialService");
const NDVISnapshot = require("../models/NDVISnapshot");

router.use(authentication);

router.get("/ndvi/:farm_id", authorization(["FARMER", "FPO_ADMIN", "EXPERT"]), async (req, res) => {
  try {
    const { farm_id } = req.params;
    const Farm = require("../models/Farm");
    const farm = await Farm.findById(farm_id);

    if (!farm) {
      return res.status(404).json({ error: "Farm not found." });
    }

    if (req.user.role === "FARMER" && farm.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to access geospatial data for this farm." });
    }

    const coordinates = farm.boundary_polygon.coordinates?.[0];
    if (!coordinates || coordinates.length < 4) {
      return res.status(400).json({ error: "Farm boundary polygon is not defined." });
    }

    const ndviData = await fetchSentinelNDVI(coordinates, farm_id);
    const result = ndviData || generateSimulatedNDVIResponse(coordinates, farm_id);

    if (result && result.ndvi_matrix && result.mean_ndvi !== undefined) {
      try {
        const snapshot = new NDVISnapshot({
          farm_id,
          mean_ndvi: parseFloat(result.mean_ndvi),
          ndvi_matrix: result.ndvi_matrix,
          source: result.source || "Simulated",
          image_type: result.image_type || "NDVI",
          center_coords: result.center_coords || coordinates[0],
        });
        await snapshot.save();
      } catch (persistErr) {
        console.error("[NDVI Auto-Persist Error]:", persistErr.message);
      }
    }

    res.json({ status: "success", data: result });
  } catch (err) {
    console.error("[Geospatial Route Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch geospatial data." });
  }
});

module.exports = router;
