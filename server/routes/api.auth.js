const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authentication');
const { handleValidationErrors, sanitizeName, sanitizeEmail, sanitizePassword, sanitizeRole } = require('../middlewares/sanitize');

router.post('/register', [
  sanitizeName(),
  sanitizeEmail(),
  sanitizePassword(),
  sanitizeRole(),
  handleValidationErrors,
], authController.registerUser);
router.post('/login', [
  sanitizeEmail(),
  sanitizePassword(),
  handleValidationErrors,
], authController.loginUser);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
