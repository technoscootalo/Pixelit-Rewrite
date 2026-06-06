const express = require("express");
const router = express.Router();

const Booster = require("../../models/Booster");
const UserBooster = require("../../models/UserBooster");

const { requireLoggedIn, requireNotBanned } = require("../../middleware/sessionUser");
const User = require("../../models/User");

router.post("/activate/:boosterCode", requireLoggedIn, requireNotBanned, async (req, res) => {
  try {
    const userId = req.session.userId;
    const boosterCode = req.params.boosterCode?.trim();
    if (!boosterCode) return res.status(400).json({ error: "Invalid booster code" });

    const booster = await Booster.findOne({ code: boosterCode, visible: true }).lean();
    if (!booster) return res.status(404).json({ error: "Booster not found" });

    const owned = await UserBooster.findOne({
      userId,
      boosterId: booster._id,
      status: "owned",
      quantity: { $gte: 1 },
    }).lean();

    if (!owned) {
      return res.status(400).json({ error: "You do not own this booster" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(booster.durationMs));

    await UserBooster.updateMany({ userId, status: "active" }, { $set: { status: "expired" } });

    const dec = await UserBooster.findOneAndUpdate(
      { _id: owned._id, quantity: { $gte: 1 } },
      { $inc: { quantity: -1 } },
      { new: true }
    );

    if (!dec) {
      return res.status(500).json({ error: "Failed to consume owned booster" });
    }

    await UserBooster.create({
      userId,
      boosterId: booster._id,
      status: "active",
      purchasedAt: owned.purchasedAt || now,
      activatedAt: now,
      expiresAt,
      quantity: 1,
    });

    return res.json({ success: true, expiresAt: expiresAt.toISOString(), multiplier: booster.multiplier });
  } catch (err) {
    console.error("POST /api/boosters/activate error:", err);
    return res.status(500).json({ error: "Failed to activate booster" });
  }
});

module.exports = router;

