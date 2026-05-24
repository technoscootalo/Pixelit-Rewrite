const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); // Built-in Node.js crypto module
const { v4: uuidv4 } = require("uuid");
const { Address6 } = require("ip-address"); // Library to normalize IPv6 formatting

const User = require("../../models/User");
const AccessKey = require("../../models/AccessKey");

const router = express.Router();

const DISCORD_WEBHOOK =
    "https://discord.com/api/webhooks/1507830658729508886/zEfOc7csDlDzpM__QtJaBWvBfdlztZPt2aNzcj0RwEpXRwjWAKro0WFmdvLS0YPs0iLK";

// Global pepper to secure your hashes against brute-force guessing attacks.
// Keep this exact string identical across your server forever.
const IP_PEPPER = process.env.IP_HASH_SECRET || "PixelitGameSecureIpPepper2026!";

// Helper function to reliably normalize and hash incoming IPs
function hashIP(rawIp) {
    if (!rawIp) return null;
    let normalizedIp = rawIp.trim();

    try {
        // Expand IPv6 blocks to a standardized layout so variations match
        if (normalizedIp.includes(":") || Address6.isValid(normalizedIp)) {
            const address = new Address6(normalizedIp);
            normalizedIp = address.correctForm(); 
        } else {
            normalizedIp = normalizedIp.toLowerCase(); // Standard IPv4 normalization
        }
    } catch (error) {
        normalizedIp = normalizedIp.toLowerCase();
    }

    // Creates a unique, consistent 64-character hex string
    return crypto
        .createHash("sha256")
        .update(normalizedIp + IP_PEPPER)
        .digest("hex");
}

router.post("/", async (req, res) => {
    try {
        let {
            username,
            password,
            accessKey
        } = req.body;

        if (!username || !password || !accessKey) {
            return res.status(400).json({
                error: "Missing fields"
            });
        }

        accessKey = accessKey.trim();

        const keyDoc = await AccessKey.findOne({
            key: accessKey
        });

        if (!keyDoc) {
            return res.status(403).json({
                error: "Invalid access key"
            });
        }

        if (keyDoc.used) {
            return res.status(403).json({
                error: "Access key already used"
            });
        }

        if (
            keyDoc.expiresAt &&
            keyDoc.expiresAt < new Date()
        ) {
            return res.status(403).json({
                error: "Access key expired"
            });
        }

        const existing = await User.findOne({
            username
        });

        if (existing) {
            return res.status(400).json({
                error: "Username already taken"
            });
        }

        // 1. Capture client IP address (handles local connections & proxy headers)
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
        
        // 2. Turn it into a consistent hash string
        const secureIpHash = hashIP(clientIp);

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // 3. Store the secure hash inside the newly created user document
        const user = await User.create({
            username,
            password: hashedPassword,
            accessKey,
            id: uuidv4(),
            ipHash: secureIpHash
        });

        keyDoc.used = true;
        await keyDoc.save();

        try {
            await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content:
                        `**${username}** has created a Pixelit account`
                })
            });
        } catch (webhookError) {
            console.error(
                "Discord webhook failed:",
                webhookError
            );
        }

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({
            error: "Server error"
        });
    }
});

module.exports = router;
