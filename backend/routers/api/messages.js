const express = require("express");
const router = express.Router();

const User = require("../../models/User");

router.get("/", async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ sent: -1 })
      .limit(10)
      .select("username role sent pfp");

    res.json(users);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load top senders"
    });
  }
});

module.exports = router;