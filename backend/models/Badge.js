const mongoose = require("mongoose");

const BadgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  image: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Badge", BadgeSchema);