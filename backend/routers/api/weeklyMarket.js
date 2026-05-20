const express = require("express");

const router = express.Router();

const WeeklyBlooks = require("../../models/WeeklyBlooks");
const User = require("../../models/User");
const Blook = require("../../models/Blook");

function getCurrentWeekKey() {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
}

router.get("/market", async (req, res) => {
  try {
    const now = new Date();

    const nextWeek = new Date(now);

    nextWeek.setUTCDate(
      now.getUTCDate() + (7 - now.getUTCDay())
    );

    nextWeek.setUTCHours(0, 0, 0, 0);

    res.json({
      weekEndsAt: nextWeek
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to load market"
    });
  }
});

router.get("/blooks", async (req, res) => {
  try {
    const weekKey = getCurrentWeekKey();

    const weekly = await WeeklyBlooks
      .findOne()
      .populate("blooks.blookId");

    if (!weekly) {
      return res.json({
        blooks: []
      });
    }

    const formatted = weekly.blooks.map(entry => ({
      blookId: entry.blookId._id,
      name: entry.blookId.blookName,
      imageUrl: entry.blookId.imageUrl,
      rarity: entry.blookId.rarity,
      backgroundUrl: entry.blookId.backgroundUrl,
      cost: entry.cost
    }));

    res.json({
      weekKey,
      endsAt: weekly.endsAt,
      blooks: formatted
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to load weekly blooks"
    });
  }
});

router.post("/blooks/buy/:blookId", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({
        error: "Not logged in"
      });
    }

    const weekKey = getCurrentWeekKey();

    const weekly = await WeeklyBlooks.findOne();
    
    if (!weekly) {
      return res.status(404).json({
        error: "No active weekly shop"
      });
    }

    const entry = weekly.blooks.find(
      b => String(b.blookId) === String(req.params.blookId)
    );

    if (!entry) {
      return res.status(400).json({
        error: "Blook not in weekly shop"
      });
    }

    const user = await User.findOne({
      id: req.session.user.id
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (user.tokens < entry.cost) {
      return res.status(400).json({
        error: "Not enough tokens"
      });
    }

    const blook = await Blook.findById(entry.blookId);

    if (!blook) {
      return res.status(404).json({
        error: "Blook not found"
      });
    }

    user.tokens -= entry.cost;

    if (!user.blooks[blook.blookName]) {
      user.blooks[blook.blookName] = 0;
    }

    user.blooks[blook.blookName] += 1;

    user.markModified("blooks");

    await user.save();

    res.json({
      success: true,
      tokens: user.tokens,
      blook
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to buy weekly blook"
    });
  }
});

module.exports = router;