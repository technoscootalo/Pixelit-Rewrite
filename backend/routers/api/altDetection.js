const express = require("express");
const router = express.Router();

const User = require("../../models/User");
const { requirePanelAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");

router.get("/", requirePanelAccess(), rateLimit({ max: 15, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const groups = await User.aggregate([
      { $unwind: "$hashedIps" },
      {
        $group: {
          _id: "$hashedIps",
          count: { $sum: 1 },
          users: {
            $push: {
              _id: "$_id",
              username: "$username",
              pfp: "$pfp",
              role: "$role",
              banned: "$banned",
              muted: "$muted",
              joinDate: "$joinDate",
            },
          },
        },
      },
      { $match: { count: { $gte: 2 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]);

    res.json({
      success: true,
      groups: groups.map((g) => ({ hashedIp: g._id, count: g.count, users: g.users })),
    });
  } catch (err) {
    console.error("altDetection list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
