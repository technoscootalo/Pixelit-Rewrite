const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  pfp: {
    type: String,
    default:
      "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
  },
  badges: { type: Array, default: [] },
  content: { type: String, required: true, trim: true },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    username: { type: String },
    content: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema, "messages");
