const express = require("express");
const router = express.Router();

const IPBlacklist = require("../../models/IPBlacklist");
const User = require("../../models/User");
const { requireDeveloperAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");
const { logAdminAction } = require("../../utils/adminLog");

router.get("/", requireDeveloperAccess(), rateLimit({ max: 20, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const entries = await IPBlacklist.find().sort({ createdAt: -1 }).lean();

    const hashedIps = entries.map((e) => e.hashedIp);
    const usersOnThoseIps = await User.find({ hashedIps: { $in: hashedIps } })
      .select("username hashedIps")
      .lean();

    const usernamesByHash = new Map();
    for (const u of usersOnThoseIps) {
      for (const h of u.hashedIps || []) {
        if (!usernamesByHash.has(h)) usernamesByHash.set(h, []);
        usernamesByHash.get(h).push(u.username);
      }
    }

    const enriched = entries.map((e) => ({
      ...e,
      usernames: usernamesByHash.get(e.hashedIp) || [],
    }));

    res.json({ success: true, entries: enriched });
  } catch (err) {
    console.error("ipBlacklist list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/", requireDeveloperAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const { userId, hashedIp, reason, durationHours } = req.body || {};

    if (typeof userId !== "string" || !userId.trim() || typeof hashedIp !== "string" || !hashedIp.trim()) {
      return res.status(400).json({ success: false, message: "A user and one of their IPs must be selected" });
    }

    const targetUser = await User.findById(userId).select("username hashedIps");
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    if (!(targetUser.hashedIps || []).includes(hashedIp)) {
      return res.status(400).json({ success: false, message: "That IP is not associated with this user" });
    }

    const hours = Number(durationHours) || 0;
    const expiresAt = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

    const entry = await IPBlacklist.findOneAndUpdate(
      { hashedIp },
      {
        hashedIp,
        reason: reason || "No blacklist reason provided",
        createdByUserId: req.authUser?.id || null,
        durationHours: hours,
        expiresAt,
        active: true,
      },
      { upsert: true, new: true }
    );

    await logAdminAction(req, {
      action: "ip_blacklist_add",
      targetType: "ip",
      targetLabel: targetUser.username,
      reason: reason || "No blacklist reason provided",
      meta: { durationHours: hours, hashedIp: hashedIp.slice(0, 12) },
    });

    res.json({ success: true, entry });
  } catch (err) {
    console.error("ipBlacklist add error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:id/remove", requireDeveloperAccess(), rateLimit({ max: 10, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const entry = await IPBlacklist.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    const associatedUser = await User.findOne({ hashedIps: entry.hashedIp }).select("username");

    await logAdminAction(req, {
      action: "ip_blacklist_remove",
      targetType: "ip",
      targetLabel: associatedUser?.username || entry.hashedIp.slice(0, 12),
    });

    res.json({ success: true, entry });
  } catch (err) {
    console.error("ipBlacklist remove error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
