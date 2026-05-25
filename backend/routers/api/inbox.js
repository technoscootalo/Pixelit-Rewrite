const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const Message = require("../../models/Messages");

router.get("/", async (req, res) => {
  try {
    const sessionUserId = req.session?.userId;
    if (!sessionUserId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const recipient = await User.findOne({ id: sessionUserId }).select("id username pfp");
    if (!recipient) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const messages = await Message.find({
      userId: recipient.id,
      content: { $regex: "gifted you" },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ messages });
  } catch (err) {
    console.error("inbox route error:", err);
    return res.status(500).json({ error: "Failed to load inbox" });
  }
});

module.exports = router;

