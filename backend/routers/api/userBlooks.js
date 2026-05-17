const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const Pack = require("../../models/Pack");
const Blook = require("../../models/Blook");

router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Not logged in"
      });
    }

    const user = await User.findOne({
      id: req.session.userId
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const packs = await Pack.find({})
      .populate("blooks");

    console.log("USER BLOOKS:", user.blooks);
    console.log("PACKS FOUND:", packs);

    const formattedPacks = packs.map(pack => ({
      name: pack.name,
      blooks: pack.blooks.map(blook => ({
        name: blook.name,
        rarity: blook.rarity,
        imageUrl: blook.imageUrl,
        owned: user.blooks?.[blook.name] || 0
      }))
    }));

    res.json({
      packs: formattedPacks
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to load blooks"
    });
  }
});

module.exports = router;