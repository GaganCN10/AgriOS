const express = require("express");
const router = express.Router();
const ndviController = require("../controllers/ndviController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.post("/save", authorization(["FARMER", "FPO_ADMIN", "EXPERT"]), ndviController.saveSnapshot);
router.get("/snapshots", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), ndviController.listSnapshots);

module.exports = router;
