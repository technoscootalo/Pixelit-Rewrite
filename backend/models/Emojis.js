const mongoose = require("mongoose");

const EmojiSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        imageUrl: {
            type: String,
            required: true,
            trim: true
        }
    },
    { 
        collection: "emojis", 
        timestamps: true  
    }
);

module.exports = mongoose.model("Emoji", EmojiSchema);