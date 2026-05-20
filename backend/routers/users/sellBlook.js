const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const Blook = require("../../models/Blook");

router.post("/", async (req, res) => {
  try {
    const { userId, blookName, quantity } = req.body;

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const blook = await Blook.findOne({ blookName });

    console.log('[sell-blook] before:', {
      userId: user.id,
      blookName,
      qty: Number(quantity),
      ownedRaw: user.blooks?.[blookName]
    });
    if (!blook) return res.status(404).json({ error: "Blook not found" });

    const qty = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 0;
    if (qty <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const ownedObj = user.blooks?.[blookName];
    const owned = typeof ownedObj === 'number'
      ? ownedObj
      : Number(ownedObj?.amount ?? 0);

    if (owned < qty) {
      return res.status(400).json({ error: "Not enough blooks", owned, requested: qty });
    }

    const totalEarned = blook.price * qty;

    user.tokens += totalEarned;

    if (typeof ownedObj === 'number') {
      const next = owned - qty;
      if (next <= 0) delete user.blooks[blookName];
      else user.blooks[blookName] = next;
    } else {
      if (!user.blooks[blookName]) {
        return res.status(400).json({ error: "Blook not owned" });
      }
      const next = Number(user.blooks[blookName].amount) - qty;
      if (!Number.isFinite(next) || next <= 0) delete user.blooks[blookName];
      else user.blooks[blookName].amount = next;
    }

    console.log('[sell-blook] after:', {
      userId: user.id,
      blookName,
      ownedAfter: user.blooks?.[blookName]
    });

    await user.save();

    const verify = await User.findOne({ id: user.id }).lean();
    console.log('[sell-blook] verify:', {
      userId: user.id,
      blookName,
      ownedPersisted: verify?.blooks?.[blookName]
    });

    res.json({
      success: true,
      gained: totalEarned,
      tokens: user.tokens
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;