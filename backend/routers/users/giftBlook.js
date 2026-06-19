const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const Blook = require("../../models/Blook");
const DISCORD_WEBHOOK_PIXELS_GIFTING_ACTIVITY = process.env.DISCORD_WEBHOOK_PIXELS_GIFTING_ACTIVITY;

router.post("/", async (req, res) => {
  try {
    const { userId, blookName, quantity, recipientUsername } = req.body || {};

    if (!userId || typeof userId !== "string") return res.status(400).json({ error: "Missing userId" });
    if (!blookName || typeof blookName !== "string") return res.status(400).json({ error: "Missing blookName" });
    if (!recipientUsername || typeof recipientUsername !== "string") return res.status(400).json({ error: "Missing recipientUsername" });

    const qty = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 0;
    if (qty <= 0) return res.status(400).json({ error: "Invalid quantity" });

    const sender = await User.findOne({ id: userId });
    if (!sender) return res.status(404).json({ error: "Sender not found" });

    const blook = await Blook.findOne({ blookName });
    if (!blook) return res.status(404).json({ error: "Blook not found" });

    if (!sender.blooks) sender.blooks = {};
    const ownedObj = sender.blooks?.[blook.blookName];
    const owned = typeof ownedObj === "number" ? ownedObj : Number(ownedObj?.amount ?? 0);

    if (owned < qty) {
      return res.status(400).json({ error: "Not enough blooks", owned, requested: qty });
    }

    const escaped = recipientUsername.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const recipient = await User.findOne({ username: new RegExp(`^${escaped}$`, "i") });

    if (!recipient) return res.status(404).json({ error: "Recipient not found" });
    if (String(recipient.id) === String(sender.id)) return res.status(400).json({ error: "You cannot gift to yourself" });

    if (typeof ownedObj === "number") {
      const next = owned - qty;
      if (next <= 0) delete sender.blooks[blook.blookName];
      else sender.blooks[blook.blookName] = next;
    } else {
      const next = Number(sender.blooks[blook.blookName].amount) - qty;
      if (!Number.isFinite(next) || next <= 0) delete sender.blooks[blook.blookName];
      else sender.blooks[blook.blookName].amount = next;
    }

    const rOwnedObj = recipient.blooks?.[blook.blookName];
    const rOwned = typeof rOwnedObj === "number" ? rOwnedObj : Number(rOwnedObj?.amount ?? 0);
    recipient.blooks = recipient.blooks || {};
    recipient.blooks[blook.blookName] = rOwned + qty;

    sender.markModified("blooks");
    recipient.markModified("blooks");
    await sender.save();
    await recipient.save();

    const notification = {
      senderUsername: sender.username,
      content: `${sender.username} gifted you ${qty} ${blook.blookName} x${qty}!`,
      pfp: "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
      createdAt: new Date(),
    };

    await User.findOneAndUpdate(
      { id: recipient.id },
      { $push: { inbox: notification } }
    );

    try {
      const ioInstance = req.app?.locals?.io;
      if (ioInstance) {
        ioInstance.to(`user:${recipient.username}`).emit("inbox:new", notification);
      }
    } catch (e) {
      console.error("Failed to emit inbox:new:", e);
    }

    if (DISCORD_WEBHOOK_PIXELS_GIFTING_ACTIVITY) {
      fetch(DISCORD_WEBHOOK_PIXELS_GIFTING_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**${sender.username}** gifted **${recipient.username}** ${qty} ${blook.blookName}`
        })
      }).catch(err => console.error("Discord Webhook (token gifting) failed:", err));
    }

    return res.json({ success: true, gifted: qty, blookName: blook.blookName });
  } catch (err) {
    console.error("giftBlook error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;