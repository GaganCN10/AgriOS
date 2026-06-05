const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const authentication = require('../middlewares/authentication');
const authorization = require('../middlewares/authorization');

// JWT verification intercepts all routes in this router
router.use(authentication);

// AGMARKNET Wholesale Prices
router.get('/prices', marketController.getPrices);

// FPO Yield Consolidation & B2B Procurement
router.post('/lot/create', authorization(['FPO_ADMIN']), marketController.createConsolidatedLot);
router.get('/lot/all', marketController.getConsolidatedLots);
router.post('/lot/bid', authorization(['AGRI_BUSINESS']), marketController.placeBid);
router.post('/lot/respond', authorization(['FPO_ADMIN']), marketController.respondToBid);

// Price Alerts
router.post('/alert/create', marketController.createPriceAlert);
router.get('/alert/all', marketController.getAlerts);

module.exports = router;
