const express = require("express");
const router = express.Router();

const Pack = require("../../models/Pack");
const User = require("../../models/User");
const { rateLimit } = require("../../middleware/rateLimit");


const { getWeekWindowUTC, isPackActiveThisWeek } = require("../../utils/weeklyMarket");

router.get("/", async (req, res) => {
  try {
    const { weekKey } = getWeekWindowUTC(new Date());

    const packs = await Pack.find({ visible: true }).populate("blooks");

    // Keep non-weekly packs always; filter weekly packs by active window.
    const filtered = packs.filter((p) => {
      // Non-weekly packs (rotation !== "weekly") show normally.
      if (!p || p.rotation !== "weekly") return true;
      return isPackActiveThisWeek(p, weekKey);
    });

    res.json(filtered);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch packs"
    });
  }
});

router.post(
  "/open/:packName",
  rateLimit({ max: 3, windowMs: 8 * 1000 }),
  async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Not logged in"
      });
    }

    const packName = req.params.packName?.trim();

    if (!packName) {
      return res.status(400).json({
        error: "Invalid pack name"
      });
    }

    const pack = await Pack.findOne({
      name: packName
    }).populate("blooks");

    if (!pack) {
      return res.status(404).json({
        error: "Pack not found"
      });
    }

    if (!pack.visible) {
      return res.status(403).json({
        error: "Pack unavailable"
      });
    }

    // Weekly-exclusive enforcement: even if someone tries to open an inactive weekly pack directly.
    if (pack.rotation === "weekly") {
      const { weekKey } = getWeekWindowUTC(new Date());

      if (!isPackActiveThisWeek(pack, weekKey)) {
        return res.status(403).json({
          error: "Pack unavailable"
        });
      }
    }



    if (!Array.isArray(pack.blooks) || pack.blooks.length === 0) {
      return res.status(400).json({
        error: "Pack has no blooks"
      });
    }

    if (
      typeof pack.cost !== "number" ||
      pack.cost <= 0
    ) {
      return res.status(500).json({
        error: "Invalid pack cost"
      });
    }

    const user = await User.findOneAndUpdate(
      {
        id: req.session.userId,
        tokens: { $gte: pack.cost }
      },
      {
        $inc: {
          tokens: -pack.cost,
          packs: 1,
          opened: 1
        }
      },

      {
        new: true
      }
    );

    if (!user) {
      return res.status(400).json({
        error: "Not enough tokens"
      });
    }

    const roll = Math.random() * 100;
    let current = 0;
    let wonBlook = null;

    for (const blook of pack.blooks) {
      const chance = Number(blook.chance) || 0;

      current += chance;

      if (roll <= current) {
        wonBlook = blook;
        break;
      }
    }

    if (!wonBlook) {
      return res.status(500).json({
        error: "Roll failed"
      });
    }

    const blookName =
      wonBlook.name ||
      wonBlook.title ||
      wonBlook.blookName;

    if (!blookName) {
      return res.status(500).json({
        error: "Blook missing name"
      });
    }

    await User.updateOne(
      { id: req.session.userId },
      {
        $inc: {
          [`blooks.${blookName}`]: 1
        }
      }
    );

    const updatedUser = await User.findOne({
      id: req.session.userId
    });

    return res.json({
      success: true,
      blook: wonBlook,
      tokens: updatedUser.tokens,
      packs: updatedUser.packs,
      blooks: updatedUser.blooks
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to open pack"
    });
  }
});

module.exports = router;