const express = require("express");
const router = express.Router();
const knowledgeBaseController = require("../controllers/knowledgeBaseController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.use(authentication);

router.get("/articles", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), knowledgeBaseController.listArticles);
router.get("/articles/:article_id", authorization(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"]), knowledgeBaseController.getArticle);
router.post("/articles", authorization(["FPO_ADMIN", "EXPERT"]), knowledgeBaseController.createArticle);
router.put("/articles/:article_id", authorization(["FPO_ADMIN", "EXPERT"]), knowledgeBaseController.updateArticle);
router.delete("/articles/:article_id", authorization(["FPO_ADMIN", "EXPERT"]), knowledgeBaseController.deleteArticle);

module.exports = router;
