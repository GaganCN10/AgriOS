const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const authentication = require('../middlewares/authentication');
const authorization = require('../middlewares/authorization');

router.use(authentication);

router.post('/trace/create', authorization(['FPO_ADMIN']), logisticsController.createTraceRecord);
router.get('/trace/all', authorization(['FPO_ADMIN', 'AGRI_BUSINESS', 'EXPERT']), logisticsController.getTraceRecords);
router.put('/trace/:trace_id', authorization(['FPO_ADMIN']), logisticsController.updateTraceStatus);

module.exports = router;
