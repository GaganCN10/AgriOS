const MandiPrice = require('../models/MandiPrice');
const ConsolidatedLot = require('../models/ConsolidatedLot');
const Alert = require('../models/Alert');

// Helper to seed simulated AGMARKNET prices if cache is empty for query
const seedSimulatedPrices = async (state, district) => {
  const sampleCrops = [
    { crop: 'Rice', variety: 'Sona Masuri', base: 4200 },
    { crop: 'Rice', variety: 'Jyothi', base: 3800 },
    { crop: 'Wheat', variety: 'Lok-1', base: 2600 },
    { crop: 'Wheat', variety: 'Sharbati', base: 3100 },
    { crop: 'Tomato', variety: 'Local', base: 1800 },
    { crop: 'Onion', variety: 'Red', base: 2200 },
    { crop: 'Potato', variety: 'Jyoti', base: 1500 }
  ];

  const seeded = [];
  const today = new Date();
  
  for (const item of sampleCrops) {
    const variance = (Math.random() - 0.5) * 400; // variance of +/- 200 INR
    const min_price = Math.round(item.base - 200 + variance);
    const max_price = Math.round(item.base + 200 + variance);
    const modal_price = Math.round((min_price + max_price) / 2);

    const priceRecord = new MandiPrice({
      state,
      district,
      market: `${district} Central Mandi`,
      crop_name: item.crop,
      variety: item.variety,
      min_price,
      max_price,
      modal_price,
      price_date: today
    });

    await priceRecord.save();
    seeded.push(priceRecord);
  }
  return seeded;
};

exports.getPrices = async (req, res) => {
  try {
    const { state, district } = req.query;
    const userId = req.user.id;

    if (!state || !district) {
      return res.status(400).json({ error: 'Parameters "state" and "district" are required.' });
    }

    // Query cached mandi prices (within last 24 hours to match caching logic)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let prices = await MandiPrice.find({
      state: { $regex: new RegExp(state, 'i') },
      district: { $regex: new RegExp(district, 'i') },
      createdAt: { $gte: cutoff }
    });

    if (prices.length === 0) {
      // Seed dynamically if cache is cold
      prices = await seedSimulatedPrices(state, district);
    }

    const userAlerts = await Alert.find({ user_id: userId, is_triggered: false });
    const triggeredAlerts = [];

    for (const alert of userAlerts) {
      const matchingPrice = prices.find((price) =>
        price.crop_name.toLowerCase() === alert.crop_name.toLowerCase() &&
        price.variety.toLowerCase() === alert.variety.toLowerCase()
      );

      if (!matchingPrice) {
        continue;
      }

      const isTriggered = alert.comparison === 'ABOVE'
        ? matchingPrice.modal_price >= alert.target_price
        : matchingPrice.modal_price <= alert.target_price;

      if (isTriggered) {
        alert.is_triggered = true;
        await alert.save();
        triggeredAlerts.push({
          id: alert._id,
          crop_name: alert.crop_name,
          variety: alert.variety,
          target_price: alert.target_price,
          comparison: alert.comparison,
          modal_price: matchingPrice.modal_price,
          market: matchingPrice.market
        });
      }
    }

    return res.status(200).json({
      last_updated: prices[0] ? prices[0].price_date : new Date(),
      market_prices: prices.map(p => ({
        id: p._id,
        market: p.market,
        crop: p.crop_name,
        variety: p.variety,
        min_price: p.min_price,
        max_price: p.max_price,
        modal_price: p.modal_price
      })),
      triggered_alerts: triggeredAlerts
    });
  } catch (err) {
    console.error(`[Mandi Price Fetch Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to retrieve wholesale prices.' });
  }
};

exports.createConsolidatedLot = async (req, res) => {
  try {
    const { crop_name, variety, total_quantity_metric_tons, expected_price_per_ton_inr, member_contributions } = req.body;
    const fpo_admin_id = req.user.id;

    if (!crop_name || !variety || !total_quantity_metric_tons || !expected_price_per_ton_inr) {
      return res.status(400).json({ error: 'Missing parameters for consolidated lot creation.' });
    }

    const newLot = new ConsolidatedLot({
      fpo_admin_id,
      crop_name,
      variety,
      total_quantity_metric_tons,
      expected_price_per_ton_inr,
      member_contributions: member_contributions || [],
      status: 'AVAILABLE'
    });

    await newLot.save();
    return res.status(201).json({ status: 'success', lot_id: newLot._id, lot: newLot });
  } catch (err) {
    console.error(`[Create Consolidated Lot Error]: ${err.message}`);
    return res.status(500).json({ error: 'Failed to compile bulk harvest lot.' });
  }
};

exports.getConsolidatedLots = async (req, res) => {
  try {
    const lots = await ConsolidatedLot.find()
      .populate('fpo_admin_id', 'name email')
      .populate('member_contributions.farmer_id', 'name email');
    return res.status(200).json(lots);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve bulk lots catalogue.' });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { lot_id, bid_price_per_ton_inr } = req.body;
    const buyer_id = req.user.id;

    if (!lot_id || !bid_price_per_ton_inr) {
      return res.status(400).json({ error: 'Missing lot ID or bid price.' });
    }

    const lot = await ConsolidatedLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: 'Consolidated lot not found.' });
    }

    // Push new bid
    lot.bids.push({
      buyer_id,
      bid_price_per_ton_inr,
      status: 'PENDING'
    });
    
    lot.status = 'BIDDED';
    await lot.save();

    return res.status(200).json({ status: 'success', bids: lot.bids });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record B2B purchase bid.' });
  }
};

exports.respondToBid = async (req, res) => {
  try {
    const { lot_id, bid_id, action } = req.body; // action: 'ACCEPT' or 'REJECT'
    const fpo_admin_id = req.user.id;

    if (!lot_id || !bid_id || !action) {
      return res.status(400).json({ error: 'Missing parameters for bid response.' });
    }

    const lot = await ConsolidatedLot.findById(lot_id);
    if (!lot) {
      return res.status(404).json({ error: 'Consolidated lot not found.' });
    }

    // Verify FPO admin ownership
    if (lot.fpo_admin_id.toString() !== fpo_admin_id) {
      return res.status(403).json({ error: 'Unauthorized to respond to bids on this lot.' });
    }

    const bid = lot.bids.id(bid_id);
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found.' });
    }

    if (action === 'ACCEPT') {
      bid.status = 'ACCEPTED';
      lot.status = 'CONTRACTED';
      // Reject all other bids
      lot.bids.forEach(b => {
        if (b._id.toString() !== bid_id) {
          b.status = 'REJECTED';
        }
      });
    } else {
      bid.status = 'REJECTED';
      // If no other pending bids, return status to AVAILABLE
      const hasOtherPending = lot.bids.some(b => b.status === 'PENDING');
      if (!hasOtherPending) {
        lot.status = 'AVAILABLE';
      }
    }

    await lot.save();
    return res.status(200).json({ status: 'success', lot });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to respond to procurement bid.' });
  }
};

exports.createPriceAlert = async (req, res) => {
  try {
    const { crop_name, variety, target_price, comparison } = req.body;
    const user_id = req.user.id;

    if (!crop_name || !variety || !target_price) {
      return res.status(400).json({ error: 'Missing price alert parameters.' });
    }

    const newAlert = new Alert({
      user_id,
      crop_name,
      variety,
      target_price,
      comparison: comparison || 'ABOVE',
      is_triggered: false
    });

    await newAlert.save();
    return res.status(201).json({ status: 'success', alert: newAlert });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register price alert.' });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(alerts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user price alerts.' });
  }
};
