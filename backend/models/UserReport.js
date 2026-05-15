const mongoose = require("mongoose");

const userReportSchema = new mongoose.Schema(
  {
    reporterUserId: { type: String, required: true },

    reportedUsername: { type: String, required: true, trim: true },

    reason: { type: String, required: true, trim: true, default: "" },

    createdAt: { type: Date, default: Date.now },

    // basic moderation flags (optional)
    status: { type: String, default: "pending" },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("UserReport", userReportSchema, "user-reports");

