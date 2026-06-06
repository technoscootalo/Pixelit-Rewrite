const express = require("express");
const router = express.Router();

const Booster = require("../../models/Booster");
const UserBooster = require("../../models/UserBooster");
const User = require("../../models/User");
const { requireLoggedIn, requireNotBanned } = require("../../middleware/sessionUser");


router.post("/buy/:boosterCode", requireLoggedIn, requireNotBanned, async (req, res) => {
  try {
    const userId = req.session.userId;
    const boosterCode = req.params.boosterCode?.trim();

    if (!boosterCode) return res.status(400).json({ error: "Invalid booster code" });

    const booster = await Booster.findOne({ code: boosterCode, visible: true }).lean();
    if (!booster) return res.status(404).json({ error: "Booster not found" });
    const userBoosterExisting = await UserBooster.findOne({
      userId,
      boosterId: booster._id,
      status: "owned",
    }).lean();

    const transactionPrice = Number(booster.price) || 0;

    const updatedUser = await User.findOneAndUpdate(

      { id: userId, tokens: { $gte: transactionPrice } },
      {
        $inc: {
          tokens: -transactionPrice,
        },
      },
      { returnDocument: "after" }
    );

    if (!updatedUser) return res.status(400).json({ error: "Not enough tokens" });

    const now = new Date();

    if (userBoosterExisting) {
      await UserBooster.updateOne(
        {
          userId,
          boosterId: booster._id,
          status: "owned",
        },
        {
          $inc: { quantity: 1 },
        }
      );
    } else {
      await UserBooster.create({
        userId,
        boosterId: booster._id,
        status: "owned",
        purchasedAt: now,
        activatedAt: null,
        expiresAt: null,
        quantity: 1,
      });
    }

    return res.json({ success: true, tokens: updatedUser.tokens });

  } catch (err) {
    console.error("POST /api/market/boosters/buy error:", err);
    return res.status(500).json({ error: "Failed to buy booster" });
  }
});

module.exports = router;

