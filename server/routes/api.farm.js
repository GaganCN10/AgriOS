const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const authMiddleware = require('../middlewares/authentication');
const authzMiddleware = require('../middlewares/authorization');
const { handleValidationErrors, sanitizeString, sanitizePositiveNumber, sanitizeQueryId, sanitizeId } = require('../middlewares/sanitize');

router.use(authMiddleware);

router.post('/create', authzMiddleware(['FARMER', 'FPO_ADMIN']), [
  sanitizeString('farm_name'),
  sanitizeString('state'),
  sanitizeString('district'),
  sanitizeString('sub_district'),
  sanitizeString('survey_number'),
  handleValidationErrors,
], farmController.createFarm);
router.get('/all', authzMiddleware(['FARMER', 'FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT']), farmController.getAllFarms);

// Crop cycle routes (matching frontend paths)
router.post('/crop/start', authzMiddleware(['FARMER', 'FPO_ADMIN']), farmController.startCropCycle);
router.get('/crop/cycles/:farmId', authzMiddleware(['FARMER', 'FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT']), farmController.getCropCyclesByFarm);
router.post('/crop/expense', authzMiddleware(['FARMER', 'FPO_ADMIN']), farmController.addExpenseToCycle);
router.put('/crop/stage/:cycleId', authzMiddleware(['FARMER', 'FPO_ADMIN']), farmController.updateCropStage);

// Financial / PDF export
router.get('/pdf/:farmId', authzMiddleware(['FARMER', 'FPO_ADMIN']), farmController.exportFinancialPDF);
router.get('/financial-profile/:farmId', authzMiddleware(['FARMER', 'FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT']), farmController.getFinancialProfile);

module.exports = router;
