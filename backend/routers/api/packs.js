const express = require("express");
const router = express.Router();
const Pack = require("../../models/Pack");
const User = require("../../models/User");
const { rateLimit } = require("../../middleware/rateLimit");
const DISCORD_WEBHOOK_PACK_OPEN = process.env.DISCORD_WEBHOOK_PACK_OPEN;

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

      const UserBooster = require("../../models/UserBooster");
      const boosterAgg = await UserBooster.find({
        userId: req.session.userId,
        status: "active",
        expiresAt: { $gt: new Date() }
      }).lean();




      let finalMultiplier = 1;
      if (boosterAgg && boosterAgg.length > 0) {
        const boosterIds = [...new Set(boosterAgg.map((u) => String(u.boosterId)))];
        const Booster = require("../../models/Booster");
        const boosters = await Booster.find({ _id: { $in: boosterIds }, visible: true })
          .select("multiplier")
          .lean();
        const mults = boosters.map((b) => Number(b.multiplier) || 1);
        finalMultiplier = mults.reduce((acc, m) => acc * m, 1);
      }

      const totalChance = pack.blooks.reduce(
        (sum, b) => sum + (Number(b.chance) || 0) * finalMultiplier,
        0
      );
      const roll = Math.random() * totalChance;

      let current = 0;
      let wonBlook = pack.blooks[0];
      for (const blook of pack.blooks) {
        current += (Number(blook.chance) || 0) * finalMultiplier;
        if (roll <= current) {
          wonBlook = blook;
          break;
        }
      }


      const blookName = (wonBlook.name || wonBlook.title || wonBlook.blookName || "Unknown")
        .replace(/\./g, "_");

      const updatedUser = await User.findOneAndUpdate(
        { id: req.session.userId, tokens: { $gte: pack.cost } },
        {
          $inc: {
            tokens: -pack.cost,
            packs: 1,
            opened: 1,
            [`blooks.${blookName}`]: 1
          }
        },
        { returnDocument: 'after', projection: "username tokens packs blooks" }
      );

      if (!updatedUser) return res.status(400).json({ error: "Not enough tokens" });

      const adjustedChance = Number(wonBlook?.chance) * finalMultiplier;

      res.json({
        success: true,
        blook: {
          ...wonBlook,
          adjustedChance,
        },
        tokens: updatedUser.tokens,
        packs: updatedUser.packs,
        blooks: updatedUser.blooks,
      });


      const rarity = (wonBlook.rarity || wonBlook.rarityName || "").toString().toLowerCase();
      if (["legendary", "chroma", "mystical"].includes(rarity) && DISCORD_WEBHOOK_PACK_OPEN) {
        fetch(DISCORD_WEBHOOK_PACK_OPEN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `**${updatedUser.username}** opened **${pack.name}** and got a **${blookName}**`
          }),
        }).catch(console.error);
      }

    } catch (err) {
      console.error("Pack Open Error:", err);
      return res.status(500).json({ error: "Failed to open pack" });
    }
  }
);

module.exports = router;
