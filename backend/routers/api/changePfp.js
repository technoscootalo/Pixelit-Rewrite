const express = require("express");
const User = require("../../models/User");
const { rateLimit } = require("../../middleware/rateLimit");

const router = express.Router();

router.put(
  "/changePfp",
  rateLimit({ 
    windowMs: 5 * 60 * 1000,
    max: 25,                 
    message: { error: "Too many profile picture updates. Please try again later." }
  }),
  async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
      }

      const { pfp } = req.body || {};

      if (typeof pfp !== "string" || !pfp.trim()) {
        return res
          .status(400)
          .json({ error: "PFP must be a non-empty string" });
      }

      const normalizedPfp = pfp.trim();

      const user = await User.findOneAndUpdate(
        { id: req.session.userId },
        { $set: { pfp: normalizedPfp } },
        { new: true }
      ).select("id username pfp");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ success: true, pfp: user.pfp });
    } catch (err) {
      console.error("changePfp error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;