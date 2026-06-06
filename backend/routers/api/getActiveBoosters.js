const express = require("express");
const router = express.Router();

const UserBooster = require("../../models/UserBooster");
const Booster = require("../../models/Booster");
const { requireLoggedIn, requireNotBanned } = require("../../middleware/sessionUser");

router.get("/active-multiplier", requireLoggedIn, requireNotBanned, async (req, res) => {
  try {
    const userId = req.session.userId;
    const now = new Date();

    const active = await UserBooster.find({
      userId,
      status: "active",
      expiresAt: { $gt: now },
    }).lean();

    if (!active || active.length === 0) {
      return res.json({ multiplier: 1 });
    }

    const boosterIds = [...new Set(active.map((a) => String(a.boosterId)))]
      .filter(Boolean);

    const boosters = await Booster.find({
      _id: { $in: boosterIds },
      visible: true,
    }).select("multiplier").lean();

    const boosterMults = boosters.map((b) => Number(b.multiplier) || 1);

    const finalMultiplier = boosterMults.reduce((acc, m) => acc * m, 1);

    return res.json({ multiplier: finalMultiplier });
  } catch (err) {
    console.error("GET /api/boosters/active-multiplier error:", err);
    return res.status(500).json({ error: "Failed to load active boosters" });
  }
});

module.exports = router;

