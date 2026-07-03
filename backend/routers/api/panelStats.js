const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const UserReport = require("../../models/UserReport");
const IPBlacklist = require("../../models/IPBlacklist");
const { requirePanelAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");

router.get("/stats", requirePanelAccess(), rateLimit({ max: 20, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      bannedUsers,
      mutedUsers,
      pendingReports,
      newUsersToday,
      activeIpBans,
      tokenAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ banned: true }),
      User.countDocuments({ muted: true }),
      UserReport.countDocuments({ status: "pending" }),
      User.countDocuments({ joinDate: { $gte: startOfDay.toISOString() } }),
      IPBlacklist.countDocuments({ active: true }),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$tokens" } } }]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        bannedUsers,
        mutedUsers,
        pendingReports,
        newUsersToday,
        activeIpBans,
        totalTokens: tokenAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("panelStats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;