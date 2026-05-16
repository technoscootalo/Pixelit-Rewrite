const express = require("express");
const router = express.Router();

const Article = require("../../models/Article");

router.get("/", async (req, res) => {
  try {
    const articles = await Article.find({ visible: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(20)
      .lean();

    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load articles" });
  }
});

module.exports = router;

