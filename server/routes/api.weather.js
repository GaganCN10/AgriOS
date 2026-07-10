const express = require("express");
const router = express.Router();
const { fetchWeatherByCoords, fetchWeatherByCityName } = require("../services/weatherService");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.get("/coords", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng query parameters are required." });
    }

    const weather = await fetchWeatherByCoords(parseFloat(lat), parseFloat(lng));
    res.json({ source: weather.source || "simulated", weather });
  } catch (err) {
    console.error("[Weather Route Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch weather data." });
  }
});

router.get("/city", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), async (req, res) => {
  try {
    const { city, country } = req.query;
    if (!city) {
      return res.status(400).json({ error: "city query parameter is required." });
    }

    const weather = await fetchWeatherByCityName(city, country);
    res.json({ source: weather.source || "simulated", weather });
  } catch (err) {
    console.error("[Weather Route Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch weather data." });
  }
});

router.get("/farm/:farm_id", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), async (req, res) => {
  try {
    const Farm = require("../models/Farm");
    const farm = await Farm.findById(req.params.farm_id);
    if (!farm) {
      return res.status(404).json({ error: "Farm not found." });
    }

    const coordinates = farm.boundary_polygon.coordinates?.[0];
    if (!coordinates || coordinates.length === 0) {
      return res.status(400).json({ error: "Farm boundary coordinates are not defined." });
    }

    const sumLng = coordinates.reduce((sum, c) => sum + c[0], 0);
    const sumLat = coordinates.reduce((sum, c) => sum + c[1], 0);
    const centerLng = sumLng / coordinates.length;
    const centerLat = sumLat / coordinates.length;

    const weather = await fetchWeatherByCoords(centerLat, centerLng);
    if (!weather) {
      return res.status(503).json({ error: "Weather service unavailable. Check OPENWEATHER_API_KEY configuration." });
    }

    res.json({ source: "openweathermap", farm_id: farm._id, weather });
  } catch (err) {
    console.error("[Weather Farm Route Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch farm weather data." });
  }
});

module.exports = router;
