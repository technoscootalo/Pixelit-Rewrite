const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, required: true },
    actorUsername: { type: String, required: true },
    actorRole: { type: String, default: "" },

    action: { type: String, required: true },
    targetType: { type: String, default: "" },
    targetLabel: { type: String, default: "" },
    reason: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminLog", adminLogSchema, "admin-logs");
