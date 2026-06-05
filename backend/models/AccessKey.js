const mongoose = require("mongoose");

const accessKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },

    discordId: {
        type: String,
        default: null
    },

    used: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

module.exports = mongoose.model("AccessKey", accessKeySchema, "accesskeys");