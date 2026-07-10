const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.get("/all", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), inventoryController.listInventory);
router.post("/add", authorization(["FARMER", "FPO_ADMIN"]), inventoryController.createInventoryItem);
router.put("/update/:item_id", authorization(["FARMER", "FPO_ADMIN"]), inventoryController.updateInventoryItem);
router.delete("/delete/:item_id", authorization(["FARMER", "FPO_ADMIN"]), inventoryController.deleteInventoryItem);
router.get("/alerts/low-stock", authorization(["FARMER", "FPO_ADMIN"]), inventoryController.getLowStockAlerts);

module.exports = router;
