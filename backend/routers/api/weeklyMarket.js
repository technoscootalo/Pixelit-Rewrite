const express = require("express");

const router = express.Router();

const WeeklyBlooks = require("../../models/WeeklyBlooks");
const User = require("../../models/User");
const Blook = require("../../models/Blook");

function getCurrentWeekKey() {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
}

async function ensureWeeklyBlooksForCurrentWeek() {
  const weekKey = getCurrentWeekKey();

  const existing = await WeeklyBlooks
    .findOne({ weekKey })
    .populate("blooks.blookId");

  if (existing) return existing;

  const allBlooks = await Blook.find({}).select("blookName imageUrl rarity backgroundUrl");

  if (!allBlooks.length) {
    return null;
  }

  const sorted = [...allBlooks].sort((a, b) => (a.blookName || "").localeCompare(b.blookName || ""));

  const WEEKLY_COUNT = Math.min(5, sorted.length);
  const startIndex = weekKey % WEEKLY_COUNT;

  const picked = [];
  for (let i = 0; i < WEEKLY_COUNT; i++) {
    const idx = (startIndex + i) % sorted.length;
    picked.push(sorted[idx]);
  }

  // Assign costs by rarity.
  const rarityToCost = {
    Common: 5000,
    Uncommon: 6000,
    Rare: 9000,
    Epic: 15000,
    Legendary: 25000,
    Chroma: 40000,
    Mystical: 60000,
  };

  const blooks = picked.map((b) => ({
    blookId: b._id,
    cost: rarityToCost[b.rarity] ?? 10000,
  }));

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
  nextWeek.setUTCHours(0, 0, 0, 0);

  const created = await WeeklyBlooks.create({
    weekKey,
    endsAt: nextWeek,
    blooks,
  });

  return created;
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

    const weekly = await ensureWeeklyBlooksForCurrentWeek();

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
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Not logged in"
      });
    }

    const weekKey = getCurrentWeekKey();


    const weekly = await ensureWeeklyBlooksForCurrentWeek();
    
    if (!weekly) {
      return res.status(404).json({
        error: "No weekly blooks available"
      });
    }


    const targetId = String(req.params.blookId);

    const entry = weekly.blooks.find((b) => {
      const rawId = b?.blookId?._id ? b.blookId._id : b?.blookId;
      return rawId && String(rawId) === targetId;
    });


    if (!entry) {
      return res.status(400).json({
        error: "Blook not in weekly shop"
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

    await User.updateOne(
      { id: req.session.userId },
      {
        $inc: {
          tokens: -entry.cost,
          [`blooks.${blook.blookName}`]: 1
        }
      }
    );

    const updatedUser = await User.findOne({ id: req.session.userId });
    user.tokens = updatedUser?.tokens ?? user.tokens;


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