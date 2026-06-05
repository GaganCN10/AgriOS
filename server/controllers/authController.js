const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, subscription_tier } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password_hash,
      role: role || 'FARMER',
      subscription_tier: subscription_tier || 'FREE'
    });

    await newUser.save();

    // Sign a token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, subscription_tier: newUser.subscription_tier },
      process.env.JWT_SECRET || 'agrios_jwt_secret_token_2026_xyz',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        subscription_tier: newUser.subscription_tier,
        api_usage_counter: newUser.api_usage_counter
      }
    });
  } catch (err) {
    console.error(`[Register Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal registration failure.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Sign a token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, subscription_tier: user.subscription_tier },
      process.env.JWT_SECRET || 'agrios_jwt_secret_token_2026_xyz',
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription_tier: user.subscription_tier,
        api_usage_counter: user.api_usage_counter
      }
    });
  } catch (err) {
    console.error(`[Login Error]: ${err.message}`);
    return res.status(500).json({ error: 'Internal authentication failure.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal profile retrieval failure.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { subscription_tier } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    
    if (subscription_tier) {
      user.subscription_tier = subscription_tier;
    }
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, subscription_tier: user.subscription_tier },
      process.env.JWT_SECRET || 'agrios_jwt_secret_token_2026_xyz',
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription_tier: user.subscription_tier,
        api_usage_counter: user.api_usage_counter
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update subscription tier.' });
  }
};
