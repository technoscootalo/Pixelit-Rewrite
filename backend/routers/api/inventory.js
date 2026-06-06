const express = require("express");
const router = express.Router();

const Booster = require("../../models/Booster");
const UserBooster = require("../../models/UserBooster");


const { requireLoggedIn } = require("../../middleware/sessionUser");
const { requireNotBanned } = require("../../middleware/sessionUser");

router.get("/", requireLoggedIn, requireNotBanned, async (req, res) => {
  try {
    const userId = req.session.userId;
    const userBoosters = await UserBooster.find({
      userId,
    })
      .select("boosterId quantity status")
      .lean();



    if (!userBoosters || userBoosters.length === 0) {
      return res.json({ items: [] });
    }

    const boosterIds = [...new Set(userBoosters.map((b) => String(b.boosterId)))];

    const boosters = await Booster.find({ _id: { $in: boosterIds }, visible: true })
      .select("code name durationMs multiplier")
      .lean();


    const boosterById = new Map(boosters.map((b) => [String(b._id), b]));

    const items = userBoosters
      .map((ub) => {
        const booster = boosterById.get(String(ub.boosterId));
        if (!booster) return null;

        if (!ub.quantity || ub.quantity <= 0) return null;

        return {
          code: booster.code,
          name: booster.name,
          quantity: ub.quantity,
          status: ub.status,
          expiresAt: ub.expiresAt,
          multiplier: booster.multiplier,
          durationMs: booster.durationMs,
        };
      })
      .filter(Boolean);



    return res.json({ items });
  } catch (err) {
    console.error("GET /api/inventory error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

