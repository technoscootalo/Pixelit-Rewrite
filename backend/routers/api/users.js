const express = require("express");
const router = express.Router();
const User = require("../../models/User");


const { requirePanelAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");
const { requireNotBanned } = require("../../middleware/sessionUser");




router.get("/", requirePanelAccess(), requireNotBanned, rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {

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



router.put("/:id/mute", requirePanelAccess(), requireNotBanned, rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

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


router.put("/:id/unmute", requirePanelAccess(), requireNotBanned, rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

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


router.put("/:id/ban", requirePanelAccess(), requireNotBanned, rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

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


router.put("/:id/unban", requirePanelAccess(), requireNotBanned, rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

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