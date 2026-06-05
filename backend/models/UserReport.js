const mongoose = require("mongoose");

const mongoose = require("mongoose");

const userReportSchema = new mongoose.Schema(
  {
    reporterUserId: { type: String, required: true },

    reportedUsername: { type: String, required: true, trim: true },

    reason: { type: String, required: true, trim: true, default: "" },

    createdAt: { type: Date, default: Date.now },

    status: { type: String, default: "pending" },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("UserReport", userReportSchema, "user-reports");

