const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const premiumGating = require('../middlewares/premiumGating');
const authMiddleware = require('../middlewares/authentication');
const authzMiddleware = require('../middlewares/authorization');
const { upload } = require('../config/upload');

router.use(authMiddleware);

router.post('/diagnose', premiumGating, upload.single('image_file'), analyticsController.diagnose);
router.post('/predict-yield', premiumGating, analyticsController.predictYield);
router.post('/predict-prices', premiumGating, analyticsController.predictPrices);
router.post('/advisor-chat', premiumGating, analyticsController.advisorChat);
router.get('/disease-logs/mine', premiumGating, analyticsController.getMyDiseaseLogs);
router.get('/disease-logs', authzMiddleware(['EXPERT']), analyticsController.getAllDiseaseLogs);
router.post('/disease-logs/verify', authzMiddleware(['EXPERT']), analyticsController.verifyDiseaseLog);

module.exports = router;
