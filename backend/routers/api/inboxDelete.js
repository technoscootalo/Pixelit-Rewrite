const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const User = require("../../models/User");
const Message = require("../../models/Messages");

router.delete("/:id", async (req, res) => {
  try {
    const sessionUserId = req.session?.userId;
    if (!sessionUserId) return res.status(401).json({ error: "Not logged in" });

    const recipient = await User.findOne({ id: sessionUserId }).select("id");
    if (!recipient) return res.status(401).json({ error: "Not logged in" });

    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const del = await Message.findOneAndDelete({
      _id: id,
      userId: recipient.id,
      content: { $regex: "gifted you" },
    });
    if (!del) return res.status(404).json({ error: "Notification not found" });

    return res.json({ success: true });
  } catch (err) {
    console.error("inbox delete error:", err);
    return res.status(500).json({ error: "Failed to delete" });
  }
});

module.exports = router;

