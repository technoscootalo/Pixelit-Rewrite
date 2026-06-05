const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    content: { type: String, required: true, trim: true },

    imageUrl: { type: String, default: "" },

    publishedAt: { type: Date, default: Date.now },

    visible: { type: Boolean, default: true },

    category: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Article", articleSchema, "articles");

