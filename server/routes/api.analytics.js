const express = require('express');
const router = express.Router();
const multer = require('multer');
const analyticsController = require('../controllers/analyticsController');
const authentication = require('../middlewares/authentication');
const authorization = require('../middlewares/authorization');
const premiumGating = require('../middlewares/premiumGating');

// Multer memory storage configuration for file buffers
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

// JWT authentication intercepts all routes in this router
router.use(authentication);

// Premium Gated High-Compute ML Operations
router.post(
  '/diagnose', 
  premiumGating, 
  upload.single('image_file'), 
  analyticsController.diagnoseDisease
);

router.post(
  '/predict-yield', 
  premiumGating, 
  analyticsController.predictYield
);

router.post(
  '/advisor-chat', 
  premiumGating, 
  analyticsController.advisorChat
);

// Expert Validation Endpoints (Restricted to AGMARKNET / EXPERT role)
router.get(
  '/disease-logs', 
  authorization(['EXPERT']), 
  analyticsController.getDiseaseLogs
);

router.post(
  '/disease-logs/verify', 
  authorization(['EXPERT']), 
  analyticsController.verifyDiseaseLog
);

module.exports = router;
