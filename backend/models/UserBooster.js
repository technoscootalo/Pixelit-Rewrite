const mongoose = require("mongoose");

const userBoosterSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    boosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booster",
      required: true
    },

    status: {
      type: String,
      required: true,
      enum: ["active", "expired"],
      default: "active",
      index: true
    },

    purchasedAt: { type: Date, required: true, default: Date.now },
    activatedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },

    quantity: { type: Number, default: 1, min: 1 }
  },
  { timestamps: true, versionKey: false }
);

userBoosterSchema.index({ userId: 1, status: 1 });
userBoosterSchema.index({ boosterId: 1 });

module.exports = mongoose.model(
  "UserBooster",
  userBoosterSchema,
  "userBoosters"
);

