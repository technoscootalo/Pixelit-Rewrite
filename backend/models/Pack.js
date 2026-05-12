const mongoose = require("mongoose");

const blookSchema = new mongoose.Schema({
    name: String,
    imageUrl: String,
    rarity: String,
    chance: Number
});

const packSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    cost: {
        type: Number,
        required: true
    },

    visible: {
        type: Boolean,
        default: true
    },

    blooks: [blookSchema]
});

module.exports = mongoose.model("Pack", packSchema, "packs");