const express = require("express");
const User = require("../../models/User");

const router = express.Router();

router.put("/changeBanner", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { banner } = req.body || {};

    if (typeof banner !== "string" || !banner.trim()) {
      return res
        .status(400)
        .json({ error: "Banner must be a non-empty string" });
    }

    const normalizedBanner = banner.trim();

    const user = await User.findOneAndUpdate(
      { id: req.session.userId },
      { $set: { banner: normalizedBanner } },
      { new: true }
    ).select("id username banner");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, banner: user.banner });
  } catch (err) {
    console.error("changeBanner error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

