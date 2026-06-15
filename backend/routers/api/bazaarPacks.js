const express = require("express");
const router = express.Router();
const Pack = require("../../models/Pack");

router.get("/", async (req, res) => {
  try {
    const packs = await Pack.find({}).populate("blooks").lean();

    const transformed = packs.map((pack) => {
      const blooks = Array.isArray(pack.blooks) ? pack.blooks : [];
      const total = blooks.reduce((s, b) => s + (Number(b.chance) || 0), 0) || 1;
      const blooksWithPercent = blooks.map((b) => ({
        ...b,
        chancePercent: Number((((Number(b.chance) || 0) / total) * 100).toFixed(2)),
      }));

      return { ...pack, blooks: blooksWithPercent };
    });

    return res.json(transformed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch bazaar packs" });
  }
});

module.exports = router;