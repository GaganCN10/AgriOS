const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authentication = require('../middlewares/authentication');

// Public auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Private profile endpoints
router.get('/profile', authentication, authController.getProfile);
router.put('/profile', authentication, authController.updateProfile);

module.exports = router;
