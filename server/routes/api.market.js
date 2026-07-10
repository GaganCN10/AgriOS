const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const logisticsController = require('../controllers/logisticsController');
const authMiddleware = require('../middlewares/authentication');
const authzMiddleware = require('../middlewares/authorization');

router.use(authMiddleware);

router.get('/prices', authzMiddleware(['FARMER', 'FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT']), marketController.getMarketPrices);
router.get('/alert/all', authzMiddleware(['FARMER', 'FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT']), marketController.getUserAlerts);
router.post('/alert/create', authzMiddleware(['FARMER', 'FPO_ADMIN']), marketController.createPriceAlert);

// Consolidated lot marketplace (frontend-facing aliases)
router.get('/lot/all', authzMiddleware(['FPO_ADMIN', 'AGRI_BUSINESS']), logisticsController.getConsolidatedLots);
router.post('/lot/create', authzMiddleware(['FPO_ADMIN']), logisticsController.createConsolidatedLot);
router.post('/lot/bid', authzMiddleware(['AGRI_BUSINESS']), logisticsController.makePurchaseOffer);
router.post('/lot/respond', authzMiddleware(['FPO_ADMIN']), logisticsController.respondToBid);

module.exports = router;
