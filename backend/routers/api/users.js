const express = require("express");
const router = express.Router();
const User = require("../../models/User");


const { requirePanelAccess } = require("../../middleware/panelAuth");
const { requireDeveloperAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");
const { requireNotBanned } = require("../../middleware/sessionUser");



router.get("/", requirePanelAccess(), requireNotBanned, rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {

  try {
    const users = await User.find().select(
      "username pfp role badges muted banned muteReason banReason muteDuration banDuration"
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



router.put("/:id/role", requirePanelAccess(), requireDeveloperAccess(), requireNotBanned, rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const { role } = req.body;

    if (typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "role must be a non-empty string" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: role.trim() },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ _id: user._id, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.post(
  "/:id/badges/add",
  requirePanelAccess(),
  requireDeveloperAccess(),
  requireNotBanned,
  rateLimit({ max: 10, windowMs: 60 * 1000 }),
  async (req, res) => {
    try {
      const { badgeId } = req.body;
      if (typeof badgeId !== "string" || !badgeId.trim()) {
        return res.status(400).json({ error: "badgeId is required" });
      }

      const Badge = require("../../models/Badge");
      const badge = await Badge.findById(badgeId.trim());
      if (!badge) return res.status(404).json({ error: "Badge not found" });

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.badges = Array.isArray(user.badges) ? user.badges : [];
      const hasBadge = user.badges.some(
        (b) => String(b.badgeId ?? b._id ?? "") === String(badge._id)
      );

      if (!hasBadge) {
        user.badges.push({
          badgeId: String(badge._id),
          _id: badge._id,
          name: badge.name,
          image: badge.image,
        });
      }

      await user.save();
      res.json({ success: true, badges: user.badges });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add badge" });
    }
  }
);

router.post(
  "/:id/badges/remove",
  requirePanelAccess(),
  requireDeveloperAccess(),
  requireNotBanned,
  rateLimit({ max: 10, windowMs: 60 * 1000 }),
  async (req, res) => {
    try {
      const { badgeId } = req.body;
      if (typeof badgeId !== "string" || !badgeId.trim()) {
        return res.status(400).json({ error: "badgeId is required" });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.badges = Array.isArray(user.badges) ? user.badges : [];

      const beforeLen = user.badges.length;
      user.badges = user.badges.filter(
        (b) => String(b.badgeId ?? b._id ?? "") !== String(badgeId.trim())
      );

      if (user.badges.length === beforeLen) {
        return res.status(404).json({ error: "User does not have that badge" });
      }

      await user.save();
      res.json({ success: true, badges: user.badges });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to remove badge" });
    }
  }
);

module.exports = router;

