const express = require("express");
const router = express.Router();

const Pack = require("../../models/Pack");

router.post("/", async (req, res) => {
  try {
    const {
      name,
      packImageUrl,
      packBackground,
      cost,
      visible
    } = req.body;

    if (!name || !packImageUrl || cost === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const pack = await Pack.create({
      name,
      packImageUrl,
      packBackground: packBackground || "",
      cost: Number(cost),
      visible: visible ?? true,
      blooks: []
    });

    res.json(pack);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create pack" });
  }
});

const Blook = require("../../models/Blook");

router.put("/:id", async (req, res) => {
  try {
    const pack = await Pack.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(pack);
  } catch (err) {
    res.status(500).json({ error: "Failed to update pack" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Pack.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete pack" });
  }
});

router.get("/", async (req, res) => {
  try {
    const packs = await Pack.find();
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch packs" });
  }
});

module.exports = router;