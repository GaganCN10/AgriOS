const User = require('../models/User');

const premiumGating = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Authentication record missing.' });
    }

    if (user.subscription_tier === 'FREE') {
      return res.status(403).json({
        error: 'Premium Engine Module Locked.',
        message: 'The requested analytical feature requires an active premium tier subscription plan.'
      });
    }

    if (user.api_usage_counter > 5000) {
      return res.status(429).json({
        error: 'Compute Limit Exceeded.',
        message: 'Your account has exhausted its high-compute analytical token quota for the current billing window.'
      });
    }

    user.api_usage_counter += 1;
    await user.save();

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal access control verification engine failure.' });
  }
};

module.exports = premiumGating;