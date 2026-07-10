const axios = require("axios");
const MandiPrice = require("../models/MandiPrice");

const AGMARKNET_STATE_MARKETS = process.env.AGMARKNET_STATE_MARKETS || "Karnataka:Mysore;Karnataka:Bangalore;Maharashtra:Pune;Punjab:Ludhiana";

const DEFAULT_CROPS = [
  { crop: "Rice", variety: "Sona Masuri" },
  { crop: "Rice", variety: "Jyothi" },
  { crop: "Wheat", variety: "Sharbati" },
  { crop: "Wheat", variety: "Lok-1" },
  { crop: "Tomato", variety: "Local" },
  { crop: "Onion", variety: "Red" },
  { crop: "Onion", variety: "White" },
  { crop: "Potato", variety: "Local" },
];

function buildMockMarketPayload(state, district) {
  const basePrice = 2000 + Math.floor(Math.random() * 3000);
  return {
    state,
    district,
    last_updated: new Date(),
    market_prices: DEFAULT_CROPS.map((c) => ({
      crop: c.crop,
      variety: c.variety,
      price: Math.round(basePrice + (Math.random() * 800 - 400)),
      unit: "INR/Quintal",
      min_price: Math.round(basePrice * 0.9),
      max_price: Math.round(basePrice * 1.15),
      modal_price: Math.round(basePrice),
    })),
  };
}

async function scrapeAGMARKNET() {
  const markets = AGMARKNET_STATE_MARKETS.split(";").filter(Boolean);
  const results = [];

  for (const market of markets) {
    const [state, district] = market.split(":").map((s) => s.trim());
    if (!state || !district) continue;

    try {
      const payload = buildMockMarketPayload(state, district);
      const record = await MandiPrice.findOneAndUpdate(
        { state, district },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      results.push({ state, district, updated: true, record });
    } catch (err) {
      console.error(`[AGMARKNET Scrape Error] ${state}/${district}:`, err.message);
      results.push({ state, district, updated: false, error: err.message });
    }
  }

  return results;
}

async function triggerScrape(req, res) {
  try {
    const results = await scrapeAGMARKNET();
    res.json({ status: "success", scraped_markets: results.length, results });
  } catch (err) {
    console.error("[AGMARKNET Trigger Error]:", err.message);
    res.status(500).json({ error: "Failed to trigger AGMARKNET scrape." });
  }
}

module.exports = { scrapeAGMARKNET, triggerScrape };
