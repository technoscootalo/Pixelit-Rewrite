const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  accessKey: { type: String, required: true },
  discordId: { type: String, default: null },

  hashedIps: {
    type: [String],
    default: [],
  },

  pfp: {
    type: String,
    default: "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
  },

  banner: {
    type: String,
    default: "https://izumiihd.github.io/pixelitcdn/assets/img/banner/pixelitBanner.png",
  },

  badges: {
    type: [
      {
        badgeId: { type: String, default: "" },
        _id: { type: mongoose.Schema.Types.ObjectId, required: false },
        name: { type: String, default: "" },
        image: { type: String, default: "" },
      }
    ],
    default: [],
  },

  role: { type: String, default: "Player" },

  tokens: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },

  blooks: { 
    type: Object, 
    default: {} 
  },

  items: {
    type: [{
      itemName: String,
      quantity: { type: Number, default: 1 }
    }],
    default: []
  },

  lastClaim: {
    type: Date,
    default: null,
  },

  inbox: {

    type: [{
      senderUsername: String,
      content: String,
      pfp: String,
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },

  muted: { type: Boolean, default: false },
  muteReason: { type: String, default: "No Reason Provided" },
  muteDuration: { type: Number, default: 0 },
  
  banned: { type: Boolean, default: false },
  banReason: { type: String, default: "No Reason Provided" },
  banDuration: { type: Number, default: 0 },

  joinDate: {
    type: String,
    default: () => new Date().toISOString(),
  },
}, { versionKey: false });

module.exports = mongoose.model("User", userSchema, "accounts");