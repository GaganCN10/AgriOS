const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");
const { handleValidationErrors, sanitizeString, sanitizePositiveNumber, sanitizeId } = require("../middlewares/sanitize");

router.use(authentication);

router.get("/all", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), taskController.listTasks);
router.post("/create", authorization(["FARMER", "FPO_ADMIN", "EXPERT"]), [
  sanitizeString('farm_id'),
  sanitizeString('title'),
  sanitizeString('category'),
  sanitizePositiveNumber('labor_hours'),
  handleValidationErrors,
], taskController.createTask);
router.put("/update/:task_id", authorization(["FARMER", "FPO_ADMIN", "EXPERT"]), [
  sanitizeId('task_id'),
  sanitizePositiveNumber('labor_hours'),
  sanitizePositiveNumber('cost_incurred_inr'),
  handleValidationErrors,
], taskController.updateTask);
router.delete("/delete/:task_id", authorization(["FARMER", "FPO_ADMIN"]), [
  sanitizeId('task_id'),
  handleValidationErrors,
], taskController.deleteTask);

module.exports = router;
