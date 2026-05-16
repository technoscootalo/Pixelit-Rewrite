const User = require("../models/User");

function requireLoggedIn(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireNotBanned(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (req.authUser && typeof req.authUser === "object") {
    if (req.authUser.banned) {
      return res.status(403).json({ error: "You are banned" });
    }
    return next();
  }

  User.findOne({ id: req.session.userId })
    .select("banned banDuration banReason")
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Not logged in" });
      }

      if (user.banned) {
        return res.status(403).json({
          error: `You are banned${user.banReason ? `: ${user.banReason}` : ""}`,
        });
      }

      next();
    })
    .catch((err) => {
      console.error("requireNotBanned error:", err);
      res.status(500).json({ error: "Server error" });
    });
}

module.exports = {
  requireLoggedIn,
  requireNotBanned,
};

