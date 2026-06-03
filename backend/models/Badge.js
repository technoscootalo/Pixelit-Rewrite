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

  description: {
    type: String,
    default:
      "fill in the description for this badge in the database"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Badge", BadgeSchema);