const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const Message = require("../../models/Messages");

router.post("/", async (req, res) => {
  try {
    const { recipientUsername, content } = req.body || {};

    const sessionUserId = req.session?.userId;
    if (!sessionUserId) return res.status(401).json({ error: "Not logged in" });

    if (!recipientUsername || typeof recipientUsername !== "string") {
      return res.status(400).json({ error: "Missing recipientUsername" });
    }
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Missing content" });
    }

    const sender = await User.findOne({ id: sessionUserId }).select("id username pfp badges");
    if (!sender) return res.status(401).json({ error: "Not logged in" });

    const recipient = await User.findOne({
      username: new RegExp(`^${recipientUsername.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i"),
    }).select("id username pfp");

    if (!recipient) return res.status(404).json({ error: "Recipient not found" });

    if (String(recipient.id) === String(sender.id)) {
      return res.status(400).json({ error: "You cannot notify yourself" });
    }

    const systemName = "System";
    const systemPfp = "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";

    const msgText = `${content.trim()}`;

    const notification = await Message.create({
      userId: recipient.id,
      username: systemName,
      pfp: systemPfp,
      badges: [],

      content: msgText,
    });

    const ioInstance = req.app?.locals?.io;
    if (ioInstance) {
      ioInstance.to(`user:${recipient.username}`).emit("inbox:new", {
        userId: notification.userId,
        username: notification.username,
        pfp: notification.pfp,
        badges: notification.badges || [],
        content: notification.content,
        createdAt: notification.createdAt,
        _id: notification._id,
      });
    }

    return res.json({ success: true, notificationId: notification._id });
  } catch (err) {
    console.error("inboxTest error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

