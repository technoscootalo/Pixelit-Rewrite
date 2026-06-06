const express = require("express");
const router = express.Router();

const UserBooster = require("../../models/UserBooster");
const Booster = require("../../models/Booster");
const User = require("../../models/User");

router.get("/market-active-boosters", async (req, res) => {
  try {
    const now = new Date();

    const active = await UserBooster.find({
      status: "active",
      expiresAt: { $gt: now },
    })
      .select("boosterId userId expiresAt activatedAt")
      .lean();


    if (!active || active.length === 0) {
      return res.json({ boosters: [] });
    }

    const boosterIds = [...new Set(active.map((a) => String(a.boosterId)))].filter(Boolean);
    const userIds = [...new Set(active.map((a) => String(a.userId)))].filter(Boolean);

    const boosters = await Booster.find({ _id: { $in: boosterIds }, visible: true })
      .select("code name multiplier")
      .lean();

    const users = await User.find({ id: { $in: userIds } })
      .select("id username")
      .lean();

    const boosterById = new Map(boosters.map((b) => [String(b._id), b]));
    const userById = new Map(users.map((u) => [String(u.id), u]));

    const boostersOut = active
      .map((ub) => {
        const booster = boosterById.get(String(ub.boosterId));
        if (!booster) return null;

        const activator = userById.get(String(ub.userId));

        const expiresAt = ub.expiresAt ? new Date(ub.expiresAt).toISOString() : null;
        const activatedAt = ub.activatedAt ? new Date(ub.activatedAt).toISOString() : null;

        return {
          boosterCode: booster.code,
          boosterName: booster.name,
          multiplier: Number(booster.multiplier) || 1,
          activatedBy: activator?.username || String(ub.userId),
          activatedByUserId: ub.userId,
          activatedAt,
          expiresAt,
        };
      })
      .filter(Boolean);

    boostersOut.sort((a, b) => {
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });

    return res.json({ boosters: boostersOut });
  } catch (err) {
    console.error("GET /api/market/boosters/market-active-boosters error:", err);
    return res.status(500).json({ error: "Failed to load active boosters" });
  }
});

module.exports = router;

