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
    if (!blook) return res.status(404).json({ error: "Blook not found" });

    const owned = user.blooks?.[blookName]?.amount || 0;

    if (owned < quantity) {
      return res.status(400).json({ error: "Not enough blooks" });
    }

    const totalEarned = blook.price * quantity;

    user.tokens += totalEarned;

    user.blooks[blookName].amount -= quantity;

    if (user.blooks[blookName].amount <= 0) {
      delete user.blooks[blookName];
    }

    await user.save();

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