const axios = require("axios");

const SENTINEL_HUB_CLIENT_ID = process.env.SENTINEL_HUB_CLIENT_ID || null;
const SENTINEL_HUB_CLIENT_SECRET = process.env.SENTINEL_HUB_CLIENT_SECRET || null;
const SENTINEL_HUB_BASE_URL = "https://services.sentinel-hub.com/ogc/wms";

async function getSentinelHubAccessToken() {
  if (!SENTINEL_HUB_CLIENT_ID || !SENTINEL_HUB_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await axios.post("https://services.sentinel-hub.com/oauth/token", {
      grant_type: "client_credentials",
      client_id: SENTINEL_HUB_CLIENT_ID,
      client_secret: SENTINEL_HUB_CLIENT_SECRET,
    });

    return response.data.access_token;
  } catch (err) {
    console.error("[Sentinel Hub Auth Error]:", err.message);
    return null;
  }
}

async function fetchSentinelNDVI(coordinates, farmId) {
  if (!SENTINEL_HUB_CLIENT_ID || !SENTINEL_HUB_CLIENT_SECRET) {
    return null;
  }

  const accessToken = await getSentinelHubAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const bbox = coordinates.flat().map((c) => `${c[1]},${c[0]}`).join(",");

    const response = await axios.get(SENTINEL_HUB_BASE_URL, {
      params: {
        service: "WMS",
        request: "GetMap",
        version: "1.3.0",
        layers: "NDVI",
        styles: "",
        crs: "EPSG:4326",
        bbox,
        width: 512,
        height: 512,
        format: "image/png",
        time: new Date().toISOString().split("T")[0],
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "arraybuffer",
      timeout: 15000,
    });

    return {
      farm_id: farmId,
      image_type: "NDVI",
      format: "image/png",
      data: response.data.toString("base64"),
      timestamp: new Date(),
      source: "Sentinel Hub",
    };
  } catch (err) {
    console.error("[Sentinel Hub Fetch Error]:", err.message);
    return null;
  }
}

async function fetchSentinelFalseColor(coordinates, farmId) {
  const accessToken = await getSentinelHubAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const bbox = coordinates.flat().map((c) => `${c[1]},${c[0]}`).join(",");

    const response = await axios.get(SENTINEL_HUB_BASE_URL, {
      params: {
        service: "WMS",
        request: "GetMap",
        version: "1.3.0",
        layers: "FALSE_COLOR",
        styles: "",
        crs: "EPSG:4326",
        bbox,
        width: 512,
        height: 512,
        format: "image/png",
        time: new Date().toISOString().split("T")[0],
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "arraybuffer",
      timeout: 15000,
    });

    return {
      farm_id: farmId,
      image_type: "FALSE_COLOR",
      format: "image/png",
      data: response.data.toString("base64"),
      timestamp: new Date(),
      source: "Sentinel Hub",
    };
  } catch (err) {
    console.error("[Sentinel Hub False Color Error]:", err.message);
    return null;
  }
}

function generateSimulatedNDVIResponse(coordinates, farmId) {
  const center = coordinates[0][0];
  return {
    farm_id: farmId,
    image_type: "NDVI_SIMULATED",
    format: "application/json",
    ndvi_matrix: Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => parseFloat((0.3 + Math.random() * 0.6).toFixed(2)))
    ),
    mean_ndvi: parseFloat((0.4 + Math.random() * 0.4).toFixed(3)),
    timestamp: new Date(),
    source: "Simulated",
    center_coords: center,
  };
}

module.exports = {
  fetchSentinelNDVI,
  fetchSentinelFalseColor,
  generateSimulatedNDVIResponse,
  getSentinelHubAccessToken,
};
