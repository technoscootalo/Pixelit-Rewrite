const express = require("express");
const router = express.Router();

const User = require("../../models/User");

router.get("/me/blooks", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const user = await User.findOne({ id: req.session.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      blooks: user.blooks || {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch blooks" });
  }
});

module.exports = router;