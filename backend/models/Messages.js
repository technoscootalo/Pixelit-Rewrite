const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  pfp: {
    type: String,
    default: "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
  },
  badges: { type: Array, default: [] },
  content: { type: String, required: true, trim: true },
  edited: { type: Boolean, default: false },
  replyToId: { type: String, default: null },
  replyToUser: { type: String, default: null },
  replyToContent: { type: String, default: null }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema, "public-chat-logs");