const express = require("express");
const router = express.Router();
const { scrapeAGMARKNET, triggerScrape } = require("../services/agmarknetScraper");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.get("/trigger", authorization(["FPO_ADMIN", "EXPERT"]), async (req, res) => {
  try {
    const results = await scrapeAGMARKNET();
    res.json({ status: "success", message: "AGMARKNET scrape completed.", results });
  } catch (err) {
    console.error("[AGMARKNET Manual Trigger Error]:", err.message);
    res.status(500).json({ error: "Failed to trigger AGMARKNET scrape." });
  }
});

module.exports = router;
