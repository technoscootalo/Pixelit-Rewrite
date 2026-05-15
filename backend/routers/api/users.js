const express = require("express");
const router = express.Router();
const User = require("../../models/User");


// GET ALL USERS
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select(
      "username pfp role muted banned muteReason banReason muteDuration banDuration"
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load users"
    });
  }
});


// MUTE USER
router.put("/:id/mute", async (req, res) => {
  try {
    const { reason, duration } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        muted: true,
        muteReason: reason || "No reason provided",
        muteDuration: Number(duration) || 0
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to mute user"
    });
  }
});


// UNMUTE USER
router.put("/:id/unmute", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        muted: false,
        muteReason: "No Reason Provided",
        muteDuration: 0
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to unmute user"
    });
  }
});


// BAN USER
router.put("/:id/ban", async (req, res) => {
  try {
    const { reason, duration } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        banned: true,
        banReason: reason || "No reason provided",
        banDuration: Number(duration) || 0
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to ban user"
    });
  }
});


// UNBAN USER
router.put("/:id/unban", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        banned: false,
        banReason: "No Reason Provided",
        banDuration: 0
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to unban user"
    });
  }
});

module.exports = router;