const express = require("express");
const router = express.Router();
const Blook = require("../../models/Blook");


// GET ALL BLOOKS (for right panel)
router.get("/", async (req, res) => {
  try {
    const blooks = await Blook.find();
    res.json(blooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CREATE BLOOK
router.post("/create", async (req, res) => {
  try {
    const blook = new Blook(req.body);
    await blook.save();

    res.json({ success: true, blook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE BLOOK
router.put("/:id", async (req, res) => {
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


// DELETE BLOOK
router.delete("/:id", async (req, res) => {
  try {
    await Blook.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;