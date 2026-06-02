const mongoose = require("mongoose");

const ipBlacklistSchema = new mongoose.Schema(
  {
    hashedIp: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "No blacklist reason provided" },
    createdByUserId: { type: String, default: null },

    durationHours: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },

    active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("IPBlacklist", ipBlacklistSchema, "ip-blacklist");

