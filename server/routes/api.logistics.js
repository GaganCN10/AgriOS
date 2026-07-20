const express = require("express");
const router = express.Router();
const logisticsController = require("../controllers/logisticsController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

// Traceability records
router.post("/trace/create", authorization(["FPO_ADMIN"]), logisticsController.createTraceRecord);
router.get("/trace/all", authorization(["FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), logisticsController.getTraceRecords);
router.put("/trace/:trace_id", authorization(["FPO_ADMIN"]), logisticsController.updateTraceStatus);
router.put("/trace/:trace_id/storage", authorization(["FPO_ADMIN"]), logisticsController.updateStorageEnvironment);
router.put("/trace/:trace_id/quality", authorization(["FPO_ADMIN", "EXPERT"]), logisticsController.updateQualityGrading);
router.get("/trace/lot/:lot_id/timeline", authorization(["FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), logisticsController.getDispatchTimeline);

// Consolidated Lots & B2B Procurement
router.post("/lots/create", authorization(["FPO_ADMIN"]), logisticsController.createConsolidatedLot);
router.get("/lots/all", authentication, logisticsController.getConsolidatedLots);
router.post("/lots/offer", authorization(["AGRI_BUSINESS"]), logisticsController.makePurchaseOffer);
router.put("/lots/offer/:lot_id", authorization(["FPO_ADMIN"]), logisticsController.updateOfferStatus);

module.exports = router;