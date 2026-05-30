const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const User = require("../../models/User");

const AccessKey = require("../../models/AccessKey");

const router = express.Router();

const DISCORD_WEBHOOK =
    "https://discord.com/api/webhooks/1507830658729508886/zEfOc7csDlDzpM__QtJaBWvBfdlztZPt2aNzcj0RwEpXRwjWAKro0WFmdvLS0YPs0iLK";

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

        const forwardedFor = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();
        const connIp = req.connection?.remoteAddress;

        const rawIp = (
            (typeof forwardedFor === "string" && forwardedFor.includes(":")) ? forwardedFor :
            (typeof connIp === "string" && connIp.includes(":")) ? connIp :
            (forwardedFor || connIp || "unknown")
        ).toString();

        const normalizedIp = rawIp
            .replace(/^[\[]|[\]]$/g, "")
            .replace(/^::ffff:/i, "");

        const hashedIp = crypto
            .createHash("sha256")
            .update(normalizedIp)
            .digest("hex");



        const ipUserExists = await User.findOne({ hashedIps: hashedIp });

        if (ipUserExists) {
            return res.status(403).json({
                error: "An account already exists under this IP"
            });
        }


        if (existing) {
            return res.status(400).json({
                error: "Username already taken"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword,
            accessKey,
            id: uuidv4(),
            hashedIps: [hashedIp]
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
