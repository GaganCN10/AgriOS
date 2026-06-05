const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const analyticsController = require('../controllers/analyticsController');
const authentication = require('../middlewares/authentication');
const authorization = require('../middlewares/authorization');

// JWT verification intercepts all routes in this router
router.use(authentication);

// Farm CRUD
router.post('/create', authorization(['FARMER', 'FPO_ADMIN']), farmController.createFarm);
router.get('/all', farmController.getFarms);
router.get('/:id', farmController.getFarmById);

// Crop Cycles
router.post('/crop/start', authorization(['FARMER', 'FPO_ADMIN']), farmController.startCropCycle);
router.get('/crop/cycles/:farmId', farmController.getCropCycles);
router.post('/crop/expense', authorization(['FARMER', 'FPO_ADMIN']), farmController.addExpense);
router.put('/crop/stage/:id', authorization(['FARMER', 'FPO_ADMIN']), farmController.updateCropStage);

// Document Package
router.get('/pdf/:farmId', analyticsController.exportFinancialPDF);
router.get('/financial-profile/:farmId', farmController.getFinancialProfile);

module.exports = router;
