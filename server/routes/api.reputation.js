const express = require("express");
const router = express.Router();
const reputationController = require("../controllers/reputationController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.post("/contribution", authorization(["EXPERT", "FPO_ADMIN"]), reputationController.recordContribution);
router.get("/leaderboard", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), reputationController.getLeaderboard);

module.exports = router;
