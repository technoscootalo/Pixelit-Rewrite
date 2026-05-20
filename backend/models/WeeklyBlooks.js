const mongoose = require("mongoose");

const WeeklyBlooksSchema = new mongoose.Schema({
  weekKey: {
    type: Number,
    required: true,
    unique: true
  },

  endsAt: {
    type: Date,
    required: true
  },

  blooks: [
    {
      blookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blook",
        required: true
      },

      cost: {
        type: Number,
        required: true,
        default: 500
      }
    }
  ]
});

module.exports = mongoose.model(
  "WeeklyBlooks",
  WeeklyBlooksSchema,
  "weekly-blooks"
);