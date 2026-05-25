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

    const user =
      (await User.findOne({ id: req.session.userId })) ||
      (await User.findById(req.session.userId));

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const packs = await Pack.find({}).populate("blooks");

    console.log("USER BLOOKS:", user.blooks);

    const WeeklyBlooks = require("../../models/WeeklyBlooks");

    const weekKey = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
    let weekly = await WeeklyBlooks
      .findOne({ weekKey })
      .populate("blooks.blookId");

    let mergedMisc = false;

    if (weekly?.blooks?.length) {
      let miscPack = packs.find((p) => p?.name === "Miscellaneous");

      if (!miscPack) {
        miscPack = {
          name: "Miscellaneous",
          blooks: []
        };
        packs.push(miscPack);
      }

      const existingIds = new Set((miscPack.blooks || []).map((b) => String(b._id)));

      for (const entry of weekly.blooks) {
        const b = entry?.blookId;
        if (!b) continue;
        const idStr = String(b._id);
        if (!existingIds.has(idStr)) {
          miscPack.blooks.push(b);
          existingIds.add(idStr);
        }
      }

      mergedMisc = true;
    }


    const formattedPacks = packs.map((pack) => ({
      name: pack.name,
      blooks: (pack.blooks || []).map((blook) => {
        const ownedAmount = user.blooks?.[blook.blookName] || 0;

        return {
          name: blook.blookName,
          rarity: blook.rarity,
          imageUrl: blook.imageUrl,
          backgroundUrl: blook.backgroundUrl,
          owned: ownedAmount
        };
      })
    }));


    res.json({
      packs: formattedPacks
    });

  } catch (err) {
    console.error("userBlooks error:", err);

    res.status(500).json({
      error: "Failed to load blooks"
    });
  }
});

module.exports = router;