const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const User = require("../../models/User");
const AccessKey = require("../../models/AccessKey");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        let { username, password, accessKey } = req.body;

        if (!username || !password || !accessKey) {
            return res.status(400).json({ error: "Missing fields" });
        }

        accessKey = accessKey.trim();

        const keyDoc = await AccessKey.findOne({ key: accessKey });

        if (!keyDoc) {
            return res.status(403).json({ error: "Invalid access key" });
        }

        if (keyDoc.used) {
            return res.status(403).json({ error: "Access key already used" });
        }

        if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) {
            return res.status(403).json({ error: "Access key expired" });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword,
            accessKey,
            id: uuidv4()
        });

        keyDoc.used = true;
        await keyDoc.save();

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;