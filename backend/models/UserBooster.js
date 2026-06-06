const mongoose = require("mongoose");

const userBoosterSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    boosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booster",
      required: true,
    },

    // statuses for the boosters:
    //  - "owned": user has this booster in their inventory and it can be activated
    //  - "active": booster is currently active (separate record consumed on activation)
    //  - "expired": previously active booster that expired
    status: {
      type: String,
      required: true,
      enum: ["owned", "active", "expired"],
      default: "owned",
      index: true,
    },

    purchasedAt: { type: Date, required: true, default: Date.now },
    activatedAt: { type: Date, required: false, default: null },
    expiresAt: { type: Date, required: false, index: true, default: null },

    quantity: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

userBoosterSchema.index({ userId: 1, status: 1 });
userBoosterSchema.index({ boosterId: 1 });

module.exports = mongoose.model("UserBooster", userBoosterSchema, "userBoosters");

