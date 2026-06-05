const User = require('../models/User');

const premiumGating = async (req, res, next) => {
  try {
    // User object parsed out from preceding JWT verification middleware
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Authentication record missing.' });
    }

    // Evaluate subscription properties
    if (user.subscription_tier === 'FREE') {
      return res.status(403).json({
        error: 'Premium Engine Module Locked.',
        message: 'The requested analytical feature requires an active premium tier subscription plan.'
      });
    }

    // Enforce dynamic volumetric rate-limiting to prevent server abuse
    if (user.api_usage_counter > 5000) {
      return res.status(429).json({
        error: 'Compute Limit Exceeded.',
        message: 'Your account has exhausted its high-compute analytical token quota for the current billing window.'
      });
    }

    // Auto-increment transactional count metrics within the request scope
    user.api_usage_counter += 1;
    await user.save();

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal access control verification engine failure.' });
  }
};

module.exports = premiumGating;
