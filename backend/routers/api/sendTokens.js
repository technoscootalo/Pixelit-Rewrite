const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const DISCORD_WEBHOOK_TOKEN_GIFTING_ACTIVITY = process.env.DISCORD_WEBHOOK_TOKEN_GIFTING_ACTIVITY;

router.put("/sendTokens", async (req, res) => {

  try {
    const sessionUserId = req.session?.userId;
    if (!sessionUserId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { recipientUserId, amount } = req.body || {};

    if (typeof recipientUserId !== "string" || !recipientUserId.trim()) {
      return res.status(400).json({ error: "recipientUserId must be a non-empty string" });
    }


    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    const sender = await User.findOne({ id: sessionUserId }).select("id username tokens");
    if (!sender) return res.status(401).json({ error: "Not logged in" });

    if (sender.tokens < numericAmount) {
      return res.status(400).json({ error: "Not enough tokens" });
    }

    const recipient = await User.findOne({
      $or: [
        { id: recipientUserId },
        { username: new RegExp(`^${recipientUserId}$`, "i") },
      ],
    }).select("id username tokens");

    if (!recipient) return res.status(404).json({ error: "Recipient not found" });


    if (String(recipient.id) === String(sender.id)) {
      return res.status(400).json({ error: "You cannot send tokens to yourself" });
    }

    const senderUpdate = await User.findOneAndUpdate(
      { id: sender.id, tokens: { $gte: numericAmount } },
      { $inc: { tokens: -numericAmount } },
      { new: true }
    );

    if (!senderUpdate) {
      return res.status(400).json({ error: "Not enough tokens" });
    }

    await User.updateOne({ id: recipient.id }, { $inc: { tokens: numericAmount } });
    await User.updateOne({ id: sender.id }, { $inc: { sent: 1 } });

    const notification = {
      senderUsername: senderUpdate.username,
      content: `${senderUpdate.username} has sent you ${numericAmount.toLocaleString()} tokens!`,
      pfp: senderUpdate.pfp || "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
      createdAt: new Date(),
    };

    await User.updateOne(
      { id: recipient.id },
      { $push: { inbox: notification } }
    );

    req.app?.locals?.io?.to(`user:${recipient.username}`).emit("inbox:new", notification);

    if (DISCORD_WEBHOOK_TOKEN_GIFTING_ACTIVITY) {
      fetch(DISCORD_WEBHOOK_TOKEN_GIFTING_ACTIVITY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**${senderUpdate.username}** gifted **${recipient.username}** ${numericAmount.toLocaleString()} tokens!`
        })
      }).catch(err => console.error("Discord Webhook (token gifting) failed:", err));
    }

    return res.json({
      success: true,
      sender: { id: senderUpdate.id, username: senderUpdate.username, tokens: senderUpdate.tokens },
      recipient: {
        id: recipient.id,
        username: recipient.username,
        tokens: (recipient.tokens || 0) + numericAmount,
      },
      gifted: {
        amount: numericAmount,
        to: recipient.username,
      },
    });
  } catch (err) {
    console.error("sendTokens error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;