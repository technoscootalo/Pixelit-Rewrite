const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const User = require("../../models/User");
const AccessKey = require("../../models/AccessKey");

const router = express.Router();
const DISCORD_WEBHOOK_AUTH = process.env.DISCORD_WEBHOOK_AUTH;

router.post("/", async (req, res) => {
    try {
        const { username, password, accessKey } = req.body;

        if (!username || !password || !accessKey) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const keyDoc = await AccessKey.findOne({ key: accessKey.trim() });
        if (!keyDoc || keyDoc.used || (keyDoc.expiresAt && keyDoc.expiresAt < new Date())) {
            return res.status(403).json({ error: "Invalid or expired access key" });
        }

        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        const hashedIp = crypto.createHash("sha256").update(ip).digest("hex");

        // allow up to 2 accounts per IP to prevent abuse without blocking shared networks
        const existingCount = await User.countDocuments({ hashedIps: hashedIp });
        if (existingCount >= 2) {
            return res.status(403).json({ error: "Too many accounts created from this IP" });
        }

        const userExists = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
        if (userExists) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            accessKey: keyDoc.key,
            id: uuidv4(),
            hashedIps: [hashedIp]
        });

        keyDoc.used = true;
        await keyDoc.save();

        if (DISCORD_WEBHOOK_AUTH) {
            fetch(DISCORD_WEBHOOK_AUTH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: `**${username}** has created a Pixelit account` })
            }).catch(err => console.error("Webhook failed:", err));
        }

        return res.status(201).json({
            message: "User registered successfully",
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;