const express = require("express");
const router = express.Router();

const User = require("../../models/User");

router.post("/sellBlook", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing blook name" });
    }

    const user = await User.findOne({ id: req.session.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.blooks || !user.blooks[name]) {
      return res.status(400).json({ error: "You don't own this blook" });
    }

    user.blooks[name] -= 1;

    if (user.blooks[name] <= 0) {
      delete user.blooks[name];
    }

    user.tokens += 10;

    await user.save();

    res.json({
      success: true,
      tokens: user.tokens,
      blooks: user.blooks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sell blook" });
  }
});

module.exports = router;