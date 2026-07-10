const express = require("express");
const router = express.Router();
const equipmentController = require("../controllers/equipmentController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.get("/all", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), equipmentController.listEquipment);
router.post("/add", authorization(["FARMER", "FPO_ADMIN"]), equipmentController.createEquipment);
router.put("/update/:equipment_id", authorization(["FARMER", "FPO_ADMIN"]), equipmentController.updateEquipment);
router.post("/maintenance/:equipment_id", authorization(["FARMER", "FPO_ADMIN"]), equipmentController.addMaintenanceLog);
router.delete("/delete/:equipment_id", authorization(["FARMER", "FPO_ADMIN"]), equipmentController.deleteEquipment);

module.exports = router;
