const mongoose = require("mongoose");

const packSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    packImageUrl: {
        type: String,
        required: true
    },

    packBackground: {
        type: String,
        default: ""
    },

    cost: {
        type: Number,
        required: true
    },

    visible: {
        type: Boolean,
        default: true
    },

    blooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blook"
    }]
});

module.exports = mongoose.model("Pack", packSchema, "packs");