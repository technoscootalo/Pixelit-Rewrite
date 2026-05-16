const express = require("express");
const router = express.Router();

const UserReport = require("../../models/UserReport");
const User = require("../../models/User");
const { requirePanelAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");




router.get("/pending", requirePanelAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {

  try {
    const reports = await UserReport.find({ status: "pending" })

      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reports });
  } catch (err) {
    console.error("moderationReports pending error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:reportId/dismiss", requirePanelAccess(), rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

  try {
    await UserReport.findByIdAndUpdate(req.params.reportId, {

      status: "dismissed",
    });

    res.json({ success: true, message: "Report dismissed." });
  } catch (err) {
    console.error("moderationReports dismiss error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:reportId/mute", requirePanelAccess(), rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

  try {
    const report = await UserReport.findById(req.params.reportId);

    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    const { reason, duration } = req.body || {};

    const targetUser = await User.findOne({ username: report.reportedUsername });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Reported user not found" });
    }

    await User.findByIdAndUpdate(targetUser._id, {
      muted: true,
      muteReason: reason || "No reason provided",
      muteDuration: Number(duration) || 0,
    });

    await UserReport.findByIdAndUpdate(req.params.reportId, {
      status: "muted",
    });

    res.json({ success: true, message: "User muted." });
  } catch (err) {
    console.error("moderationReports mute error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:reportId/ban", requirePanelAccess(), rateLimit({ max: 5, windowMs: 60 * 1000 }), async (req, res) => {

  try {
    const report = await UserReport.findById(req.params.reportId);

    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    const { reason, duration } = req.body || {};

    const targetUser = await User.findOne({ username: report.reportedUsername });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Reported user not found" });
    }

    await User.findByIdAndUpdate(targetUser._id, {
      banned: true,
      banReason: reason || "No reason provided",
      banDuration: Number(duration) || 0,
    });

    await UserReport.findByIdAndUpdate(req.params.reportId, {
      status: "banned",
    });

    res.json({ success: true, message: "User banned." });
  } catch (err) {
    console.error("moderationReports ban error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

