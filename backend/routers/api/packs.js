const express = require("express");
const router = express.Router();
const Pack = require("../../models/Pack");
const Blook = require("../../models/Blook");
const User = require("../../models/User");
const { rateLimit } = require("../../middleware/rateLimit");
const DISCORD_WEBHOOK_PACK_OPEN = process.env.DISCORD_WEBHOOK_PACK_OPEN;

router.get("/", async (req, res) => {
  try {
    const packs = await Pack.find({ visible: true }).populate("blooks").lean();
    const transformed = packs.map((pack) => {
      const blooks = Array.isArray(pack.blooks) ? pack.blooks : [];
      const total = blooks.reduce((s, b) => s + (Number(b.chance) || 0), 0) || 1;
      const blooksWithPercent = blooks.map((b) => ({
        ...b,
        chancePercent: Number(((Number(b.chance) || 0) / total * 100).toFixed(2))
      }));

      return {
        ...pack,
        blooks: blooksWithPercent
      };
    });

    return res.json(transformed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch packs" });
  }
  
});

router.post(
  "/open/:packName",
  rateLimit({ max: 60, windowMs: 60000 }),
  async (req, res) => {
    try {
      const packName = req.params.packName?.trim();
      if (!packName) return res.status(400).json({ error: "Invalid pack name" });

      if (!global.packCache) global.packCache = {};
      let pack = global.packCache[packName];

      const originalPackName = packName;

      if (!pack) {
        pack = await Pack.findOne({ name: packName }).populate("blooks").lean();

        if (!pack) {
          const fallbackName = originalPackName.replace(/\s*:\d+\s*$/, "");
          if (fallbackName && fallbackName !== originalPackName) {
            pack = await Pack.findOne({ name: fallbackName }).populate("blooks").lean();
            if (pack) global.packCache[fallbackName] = pack;
          }
        }

        if (pack) global.packCache[originalPackName] = pack;
      } else {
        try {
          const ids = (pack.blooks || []).map(b => b._id || b);
          if (ids.length) {
            const fresh = await Blook.find({ _id: { $in: ids } }).lean();
            pack.blooks = ids.map(id => fresh.find(f => f._id.toString() === id.toString())).filter(Boolean);
            global.packCache[packName] = pack;
          }
        } catch (e) {
          console.error('Failed to refresh cached blooks for pack:', e);
        }
      }

      if (!pack || !pack.visible || !pack.blooks?.length) {
        return res.status(404).json({ error: "Pack unavailable" });
      }

      const totalChance = pack.blooks.reduce((sum, b) => sum + (Number(b.chance) || 0), 0);
      const roll = Math.random() * totalChance;

      let current = 0;
      let wonBlook = pack.blooks[0];
      for (const blook of pack.blooks) {
        current += Number(blook.chance) || 0;
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

      res.json({
        success: true,
        blook: wonBlook,
        tokens: updatedUser.tokens,
        packs: updatedUser.packs,
        blooks: updatedUser.blooks
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