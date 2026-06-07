const mongoose = require("mongoose");
const BlookSchema = new mongoose.Schema({
  blookName: {
    type: String,
    required: true,
    unique: true
  },

  rarity: {
    type: String,
    required: true
  },

  imageUrl: {
    type: String,
    required: true
  },

  backgroundUrl: {
    type: String,
    default: ""
  },

  price: {
    type: Number,
    default: 0
  },

  chance: {
    type: Number,
    required: true
  },

  obtainable: {
    type: Boolean,
    default: true
  },
  
}, { versionKey: false });
module.exports = mongoose.model("Blook", BlookSchema);
