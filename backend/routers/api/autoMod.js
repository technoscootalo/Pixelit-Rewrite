const express = require("express");
const router = express.Router();

const AutoModFlag = require("../../models/AutoModFlag");
const User = require("../../models/User");
const { requirePanelAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");
const { logAdminAction } = require("../../utils/adminLog");

router.get("/pending", requirePanelAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const flags = await AutoModFlag.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, flags });
  } catch (err) {
    console.error("autoMod pending error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:flagId/dismiss", requirePanelAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const flag = await AutoModFlag.findByIdAndUpdate(req.params.flagId, { status: "dismissed" });
    if (!flag) return res.status(404).json({ success: false, message: "Flag not found" });

    await logAdminAction(req, {
      action: "automod_dismiss",
      targetType: "user",
      targetLabel: flag.username,
    });

    res.json({ success: true, message: "Flag dismissed." });
  } catch (err) {
    console.error("autoMod dismiss error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:flagId/mute", requirePanelAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const flag = await AutoModFlag.findById(req.params.flagId);
    if (!flag) return res.status(404).json({ success: false, message: "Flag not found" });

    const { reason, duration } = req.body || {};

    const targetUser = await User.findOneAndUpdate(
      { id: flag.userId },
      {
        muted: true,
        muteReason: reason || "Automated spam detection",
        muteDuration: Number(duration) || 0,
      },
      { new: true }
    );
    if (!targetUser) return res.status(404).json({ success: false, message: "Flagged user not found" });

    await AutoModFlag.findByIdAndUpdate(req.params.flagId, { status: "muted" });

    await logAdminAction(req, {
      action: "automod_mute",
      targetType: "user",
      targetLabel: targetUser.username,
      reason: reason || "Automated spam detection",
      meta: { duration: Number(duration) || 0, viaFlag: req.params.flagId },
    });

    res.json({ success: true, message: "User muted." });
  } catch (err) {
    console.error("autoMod mute error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:flagId/ban", requirePanelAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const flag = await AutoModFlag.findById(req.params.flagId);
    if (!flag) return res.status(404).json({ success: false, message: "Flag not found" });

    const { reason, duration } = req.body || {};

    const targetUser = await User.findOneAndUpdate(
      { id: flag.userId },
      {
        banned: true,
        banReason: reason || "Automated spam detection",
        banDuration: Number(duration) || 0,
      },
      { new: true }
    );
    if (!targetUser) return res.status(404).json({ success: false, message: "Flagged user not found" });

    await AutoModFlag.findByIdAndUpdate(req.params.flagId, { status: "banned" });

    await logAdminAction(req, {
      action: "automod_ban",
      targetType: "user",
      targetLabel: targetUser.username,
      reason: reason || "Automated spam detection",
      meta: { duration: Number(duration) || 0, viaFlag: req.params.flagId },
    });

    res.json({ success: true, message: "User banned." });
  } catch (err) {
    console.error("autoMod ban error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
