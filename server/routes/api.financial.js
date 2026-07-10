const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authMiddleware = require('../middlewares/authentication');
const authzMiddleware = require('../middlewares/authorization');

router.use(authMiddleware);

router.post('/kcc/calculate', authzMiddleware(['FARMER', 'FPO_ADMIN']), financialController.calculateKCC);
router.post('/kcc/bulk-calculate', authzMiddleware(['FPO_ADMIN']), financialController.bulkCalculateKCC);
router.post('/pmfby/track', authzMiddleware(['FARMER', 'FPO_ADMIN']), financialController.trackPMFBY);
router.get('/document/:farm_id', authzMiddleware(['FARMER', 'FPO_ADMIN']), financialController.generateDocumentPackage);

module.exports = router;
