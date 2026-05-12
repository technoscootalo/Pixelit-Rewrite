const express = require("express");
const router = express.Router();

const User = require("../../models/User");

router.get("/", async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ tokens: -1 })
      .limit(10)
      .select("username role tokens pfp");

    res.json(users);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load token leaderboard"
    });
  }
});


module.exports = router;