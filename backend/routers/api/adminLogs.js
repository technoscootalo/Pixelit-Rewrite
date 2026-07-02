const express = require("express");
const router = express.Router();

const AdminLog = require("../../models/AdminLog");
const { requirePanelAccess } = require("../../middleware/panelAuth");
const { rateLimit } = require("../../middleware/rateLimit");

// Developer-panel-only actions (role changes, badge edits from Manage Users) don't
// belong on the admin-facing audit log — they're still written to the collection,
// just excluded from this listing.
const DEV_ONLY_ACTIONS = ["role_change", "badge_add", "badge_remove"];

router.get("/", requirePanelAccess(), rateLimit({ max: 20, windowMs: 60 * 1000 }), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const filter = { action: { $nin: DEV_ONLY_ACTIONS } };
    if (req.query.action && !DEV_ONLY_ACTIONS.includes(req.query.action)) filter.action = req.query.action;
    if (req.query.actor) filter.actorUsername = req.query.actor;

    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(filter),
    ]);

    res.json({ success: true, logs, total, page, limit });
  } catch (err) {
    console.error("adminLogs list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
