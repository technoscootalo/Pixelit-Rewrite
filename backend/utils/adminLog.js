const AdminLog = require("../models/AdminLog");

async function logAdminAction(req, { action, targetType = "", targetLabel = "", reason = "", meta = {} }) {
  try {
    const actor = req.authUser;
    if (!actor) return;

    await AdminLog.create({
      actorId: actor.id || String(actor._id || ""),
      actorUsername: actor.username || "unknown",
      actorRole: actor.role || "",
      action,
      targetType,
      targetLabel,
      reason,
      meta,
    });
  } catch (err) {
    console.error("Failed to write admin log:", err);
  }
}

module.exports = { logAdminAction };
