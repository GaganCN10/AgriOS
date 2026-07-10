const express = require("express");
const router = express.Router();
const fpoAdminController = require("../controllers/fpoAdminController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.get("/members", authorization(["FPO_ADMIN", "EXPERT"]), fpoAdminController.listFPOMembers);
router.post("/members/add", authorization(["FPO_ADMIN"]), fpoAdminController.addMember);
router.put("/members/validate/:member_id", authorization(["FPO_ADMIN"]), fpoAdminController.validateMember);
router.delete("/members/remove/:member_id", authorization(["FPO_ADMIN"]), fpoAdminController.removeMember);

module.exports = router;
