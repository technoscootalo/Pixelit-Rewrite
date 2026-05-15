const express = require("express");
const router = express.Router();

const UserReport = require("../../models/UserReport");
const User = require("../../models/User");

router.post("/", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: "You must be logged in." });
    }

    const reporterUserId = req.session.userId;
    const reporter = await User.findOne({ id: reporterUserId }).select("username");
    const reporterUsername = reporter?.username;

    if (!reporterUsername) {
      return res.status(401).json({ success: false, message: "You must be logged in." });
    }

    const { username, reason } = req.body || {};

    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }

    const trimmedReason = (reason ?? "").toString().trim();
    if (!trimmedReason) {
      return res.status(400).json({ success: false, message: "Reason is required." });
    }

    await UserReport.create({
      reporterUserId,
      reporterUsername,
      reportedUsername: username,
      reason: trimmedReason,
      status: "pending",
    });

    return res.json({ success: true, message: "Report submitted. Thanks!" });
  } catch (err) {
    console.error("reportUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;

