const User = require("../models/User");

const PANEL_ROLES = ["Owner", "Developer", "Community Manager", "Admin"];
const DEVELOPER_ROLES = ["Owner", "Developer"];

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireRoles(allowedRoles) {
  return async function (req, res, next) {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
      }

      const user = await User.findOne({ id: req.session.userId }).select("id username role");
      if (!user) {
        return res.status(401).json({ error: "Not logged in" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      req.authUser = user;
      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  };
}

function requirePanelAccess() {
  return [requireLogin, requireRoles(PANEL_ROLES)];
}

function requireDeveloperAccess() {
  return [requireLogin, requireRoles(DEVELOPER_ROLES)];
}

module.exports = {
  requireLogin,
  requireRoles,
  requirePanelAccess,
  requireDeveloperAccess,
  PANEL_ROLES,
  DEVELOPER_ROLES,
};
