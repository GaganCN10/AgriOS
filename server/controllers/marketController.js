const axios = require("axios");
const MandiPrice = require("../models/MandiPrice");
const Alert = require("../models/Alert");
const User = require("../models/User");
const { sendPriceAlertEmail } = require("../services/emailService");

exports.getMarketPrices = async (req, res) => {
  const { state, district } = req.query;

  try {
    let marketPrices = await MandiPrice.findOne({ state, district }).sort({ last_updated: -1 });
    
    const triggeredAlerts = [];
    if (marketPrices && marketPrices.market_prices) {
      const userAlerts = await Alert.find({ user_id: req.user.id, triggered: false });
      for (const alert of userAlerts) {
        const currentCropPrice = marketPrices.market_prices.find(mp => 
          mp.crop.toLowerCase() === alert.crop_name.toLowerCase() &&
          (alert.variety === "Any" || mp.variety.toLowerCase() === alert.variety.toLowerCase())
        );

        if (currentCropPrice) {
          let shouldTrigger = false;
          if (alert.comparison === "ABOVE" && currentCropPrice.price >= alert.target_price) {
            shouldTrigger = true;
          } else if (alert.comparison === "BELOW" && currentCropPrice.price <= alert.target_price) {
            shouldTrigger = true;
          }

          if (shouldTrigger) {
            alert.triggered = true;
            alert.triggered_date = new Date();
            alert.triggered_price = currentCropPrice.price;
            alert.market = `${district} Mandi`;
            await alert.save();
            triggeredAlerts.push(alert);

            const user = await User.findById(req.user.id).select("name email");
            if (user && user.email) {
              sendPriceAlertEmail({
                to: user.email,
                crop_name: alert.crop_name,
                variety: alert.variety,
                target_price: alert.target_price,
                market: alert.market,
                comparison: alert.comparison,
                triggered_price: currentCropPrice.price,
              }).catch((emailErr) => {
                console.error("[Email Alert Error]:", emailErr.message);
              });
            }
          }
        }
      }
    }

    if (marketPrices) {
      return res.json({ ...marketPrices.toObject(), triggered_alerts: triggeredAlerts });
    }

    const mockPrices = {
      last_updated: new Date(),
      market_prices: [
        { crop: "Wheat", variety: "Local", price: 2000, unit: "INR/Quintal" },
        { crop: "Rice", variety: "Sona Masuri", price: 3000, unit: "INR/Quintal" },
      ],
    };

    const newMandiPrice = new MandiPrice({ state, district, ...mockPrices });
    await newMandiPrice.save();
    
    res.json({ ...mockPrices, triggered_alerts: triggeredAlerts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.createPriceAlert = async (req, res) => {
  const { crop_name, variety, target_price, comparison } = req.body;

  try {
    const newAlert = new Alert({
      user_id: req.user.id,
      crop_name,
      variety: variety || "Any",
      target_price,
      comparison
    });
    const alert = await newAlert.save();
    res.status(201).json({ status: "success", alert_id: alert.id, alert });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getUserAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
