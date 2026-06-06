const express = require("express");
const router = express.Router();

const Booster = require("../../models/Booster");

router.get("/", async (req, res) => {
  try {
    const boosters = await Booster.find({ visible: true })
      .select(
        "code name image description multiplier durationMs price visible"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ boosters });
  } catch (err) {
    console.error("GET /api/boosters error:", err);
    return res.status(500).json({ error: "Failed to fetch boosters" });
  }
});


module.exports = router;

