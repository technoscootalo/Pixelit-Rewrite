const express = require("express");
const router = express.Router();
const Blook = require("../../models/Blook");
const { requireDeveloperAccess } = require("../../middleware/panelAuth");



router.get("/", async (req, res) => {
  try {
    const blooks = await Blook.find();
    res.json(blooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/create", requireDeveloperAccess(), async (req, res) => {

  try {
    const blook = new Blook(req.body);
    await blook.save();

    res.json({ success: true, blook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", requireDeveloperAccess(), async (req, res) => {

  try {
    const updated = await Blook.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", requireDeveloperAccess(), async (req, res) => {

  try {
    await Blook.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;