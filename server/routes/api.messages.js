const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authentication = require("../middlewares/authentication");

router.use(authentication);

router.post("/send", messageController.sendMessage);
router.get("/inbox", messageController.getInbox);
router.get("/sent", messageController.getSent);
router.put("/read/:message_id", messageController.markAsRead);
router.delete("/delete/:message_id", messageController.deleteMessage);

module.exports = router;
