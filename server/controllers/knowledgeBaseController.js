const KnowledgeBase = require("../models/KnowledgeBase");

exports.listArticles = async (req, res) => {
  try {
    const { crop_name, category, region, search } = req.query;
    const filter = {};

    if (crop_name) filter.crop_name = crop_name;
    if (category) filter.category = category;
    if (region) filter.region = region;
    if (search) {
      filter.$text = { $search: search };
    }

    const articles = await KnowledgeBase.find(filter)
      .populate("verified_by", "name email")
      .sort({ createdAt: -1 });

    res.json(articles);
  } catch (err) {
    console.error("[Knowledge Base List Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch knowledge base articles." });
  }
};

exports.getArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const article = await KnowledgeBase.findById(article_id).populate("verified_by", "name email");

    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    article.views += 1;
    await article.save();

    res.json(article);
  } catch (err) {
    console.error("[Knowledge Base Get Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch article." });
  }
};

exports.createArticle = async (req, res) => {
  try {
    if (!["FPO_ADMIN", "EXPERT"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only FPO_ADMIN and EXPERT can create articles." });
    }

    const { title, crop_name, region, category, content, treatment_protocol, severity_level } = req.body;

    if (!title || !crop_name || !category || !content) {
      return res.status(400).json({ error: "title, crop_name, category, and content are required." });
    }

    const article = new KnowledgeBase({
      title,
      crop_name,
      region: region || "General",
      category,
      content,
      treatment_protocol: treatment_protocol || null,
      severity_level: severity_level || "MEDIUM",
      verified_by: req.user.role === "EXPERT" ? req.user.id : null,
      is_verified: req.user.role === "EXPERT",
    });

    await article.save();
    res.status(201).json({ status: "success", article });
  } catch (err) {
    console.error("[Knowledge Base Create Error]:", err.message);
    res.status(500).json({ error: "Failed to create article." });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const { title, content, treatment_protocol, severity_level, is_verified } = req.body;

    const article = await KnowledgeBase.findById(article_id);
    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (treatment_protocol !== undefined) article.treatment_protocol = treatment_protocol;
    if (severity_level !== undefined) article.severity_level = severity_level;
    if (is_verified !== undefined && req.user.role === "EXPERT") {
      article.is_verified = is_verified;
      article.verified_by = req.user.id;
    }

    await article.save();
    res.json({ status: "success", article });
  } catch (err) {
    console.error("[Knowledge Base Update Error]:", err.message);
    res.status(500).json({ error: "Failed to update article." });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const article = await KnowledgeBase.findById(article_id);
    if (!article) {
      return res.status(404).json({ error: "Article not found." });
    }

    if (req.user.role !== "FPO_ADMIN" && req.user.role !== "EXPERT") {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    await KnowledgeBase.findByIdAndDelete(article_id);
    res.json({ status: "success", message: "Article deleted." });
  } catch (err) {
    console.error("[Knowledge Base Delete Error]:", err.message);
    res.status(500).json({ error: "Failed to delete article." });
  }
};
