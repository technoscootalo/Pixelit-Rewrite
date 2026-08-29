const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const Blook = require("../../models/Blook");
const { rateLimit } = require("../../middleware/rateLimit");

const RARITY_SELL_VALUES = {
  common: 0,
  uncommon: 5,
  rare: 20,
  epic: 75,
  legendary: 200,
  chroma: 300,
  mystical: 1000,
};

router.post(
  "/",
  rateLimit({
    windowMs: 10 * 1000, 
    max: 10,         
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many sell requests. Please wait a moment." });
    }
  }),
  async (req, res) => {
  try {
    const { blookName, quantity } = req.body || {};
    const userId = req.session.userId;

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!blookName || typeof blookName !== "string") {
      return res.status(400).json({ error: "Missing blookName" });
    }

    const qty = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 0;
    if (qty <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const blook = await Blook.findOne({ blookName });
    if (!blook) return res.status(404).json({ error: "Blook not found" });

    const rarityKey = String(blook.rarity || "").toLowerCase();
    const sellPerBlook = RARITY_SELL_VALUES[rarityKey] ?? 0;

    const ownedObj = user.blooks?.[blook.blookName];
    const owned = typeof ownedObj === "number"
      ? ownedObj
      : Number(ownedObj?.amount ?? 0);

    if (owned < qty) {
      return res.status(400).json({ error: "Not enough blooks", owned, requested: qty });
    }

    user.tokens += sellPerBlook * qty;

    if (typeof ownedObj === "number") {
      const next = owned - qty;
      if (next <= 0) delete user.blooks[blook.blookName];
      else user.blooks[blook.blookName] = next;
    } else {
      const next = Number(user.blooks[blook.blookName].amount) - qty;
      if (!Number.isFinite(next) || next <= 0) delete user.blooks[blook.blookName];
      else user.blooks[blook.blookName].amount = next;
    }

    user.markModified("blooks");

    await user.save();

    return res.json({
      success: true,
      gained: sellPerBlook * qty,
      tokens: user.tokens,
    });
  } catch (err) {
    console.error("sell-blook error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
