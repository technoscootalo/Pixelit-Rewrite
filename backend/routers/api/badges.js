const express = require("express");
const router = express.Router();
const Badge = require("../../models/Badge");
const { requireDeveloperAccess } = require("../../middleware/panelAuth");

router.get("/", async (req, res) => {

  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/create", requireDeveloperAccess(), async (req, res) => {

  try {
    const { name, image } = req.body;

    const badge = new Badge({
      name,
      image
    });

    await badge.save();
    res.json(badge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireDeveloperAccess(), async (req, res) => {

  try {
    await Badge.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;