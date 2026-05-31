const express = require("express");
const router = express.Router();

const Pack = require("../../models/Pack");
const User = require("../../models/User");

const { rateLimit } = require("../../middleware/rateLimit");

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1510120522988654812/PsMxHEN1nXdl1YSStCt1lal8qJIJUoKCmcwUouGue00AneEQlF0XZOXMtGCZ6x5avmhh";

router.get("/", async (req, res) => {
  try {
    const packs = await Pack.find({ visible: true }).populate("blooks");
    return res.json(packs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch packs" });
  }
});

router.post(
  "/open/:packName",
  rateLimit({ max: 10, windowMs: 8000 }),
  async (req, res) => {
    try {
      const packName = req.params.packName?.trim();
      if (!packName) return res.status(400).json({ error: "Invalid pack name" });
      if (!global.packCache) global.packCache = {};
      let pack = global.packCache[packName];
      
      if (!pack) {
        pack = await Pack.findOne({ name: packName }).populate("blooks").lean();
        if (pack) global.packCache[packName] = pack;
      }

      if (!pack || !pack.visible || !pack.blooks?.length) {
        return res.status(404).json({ error: "Pack unavailable" });
      }

      const chances = (pack.blooks || []).map((b) => Number(b.chance) || 0);
      const totalChance = chances.reduce((a, c) => a + c, 0);
      let wonBlook = pack.blooks.find((b, i, arr) => {
         const roll = Math.random() * totalChance;
         let current = 0;
         for (const blook of arr) {
           current += Number(blook.chance) || 0;
           if (roll <= current) return blook;
         }
         return arr[0];
      });

      const blookName = wonBlook.name || wonBlook.title || wonBlook.blookName || "Unknown";

      const updatedUser = await User.findOneAndUpdate(
        { id: req.session.userId, tokens: { $gte: pack.cost } },
        { $inc: { tokens: -pack.cost, packs: 1, opened: 1, [`blooks.${blookName}`]: 1 } },
        { returnDocument: 'after', projection: "username tokens packs blooks" }
      );

      if (!updatedUser) return res.status(400).json({ error: "Not enough tokens" });

      res.json({
        success: true,
        blook: wonBlook,
        tokens: updatedUser.tokens,
        packs: updatedUser.packs,
        blooks: updatedUser.blooks
      });

      fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `**${updatedUser.username}** opened **${pack.name}** and got a **${blookName}**`
        }),
      }).catch(console.error);

    } catch (err) {
      console.error("Pack Open Error:", err);
      return res.status(500).json({ error: "Failed to open pack" });
    }
  }
);

module.exports = router;