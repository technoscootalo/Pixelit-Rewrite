const mongoose = require("mongoose");

const boosterSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: "3_hour_booster"
    },

    name: {
      type: String,
      required: true,
      trim: true,
      default: "3 Hour Booster"
    },

    image: {
      type: String,
      default:
        "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/placeholder.png"
    },

    description: {
      type: String,
      default:
        "Boost your luck. Increase your drop chance rates for rare pixels when opening packs in the market."
    },

    multiplier: { type: Number, required: true, min: 0, default: 2 },
    durationMs: { type: Number, required: true, min: 0, default: 3 * 60 * 60 * 1000 },

    visible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booster", boosterSchema, "boosters");

