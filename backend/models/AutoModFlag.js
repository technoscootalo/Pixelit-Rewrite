const mongoose = require("mongoose");

const autoModFlagSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    pfp: { type: String, default: "" },

    messages: {
      type: [
        {
          content: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    reason: {
      type: String,
      default: "Sent 5+ consecutive chat messages with no replies from other users",
    },

    status: { type: String, default: "pending" },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

autoModFlagSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AutoModFlag", autoModFlagSchema, "automod-flags");
