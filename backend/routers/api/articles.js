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

router.post("/create", async (req, res) => {
  try {
    const { title, content, imageUrl = "", visible = true, publishedAt, category = "" } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const article = await Article.create({
      title: title.trim(),
      content: content.trim(),
      imageUrl,
      visible: Boolean(visible),
      category,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    });

    res.json({ success: true, article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create article" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, content, imageUrl, visible, publishedAt, category } = req.body || {};
    const { id } = req.params;

    const update = {};
    if (title !== undefined) update.title = typeof title === "string" ? title.trim() : title;
    if (content !== undefined) update.content = typeof content === "string" ? content.trim() : content;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (visible !== undefined) update.visible = Boolean(visible);
    if (category !== undefined) update.category = category;
    if (publishedAt !== undefined) update.publishedAt = publishedAt ? new Date(publishedAt) : publishedAt;

    const article = await Article.findByIdAndUpdate(id, update, { new: true });
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json({ success: true, article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update article" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByIdAndDelete(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete article" });
  }
});

module.exports = router;
