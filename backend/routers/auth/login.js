const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../../models/User");

const router = express.Router();

const DISCORD_WEBHOOK =
    "https://discord.com/api/webhooks/1507830658729508886/zEfOc7csDlDzpM__QtJaBWvBfdlztZPt2aNzcj0RwEpXRwjWAKro0WFmdvLS0YPs0iLK";

router.post("/", async (req, res) => {
    try {

        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Username or password incorrect"
            });
        }

        const user = await User.findOne({
            username
        });

        if (!user) {
            return res.status(400).json({
                error: "Username or password incorrect"
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {
            return res.status(400).json({
                error: "Username or password incorrect"
            });
        }

        if (user.banned) {

            let banMessage =
                `You have been banned from Pixelit\n` +
                `Reason: ${user.banReason || "No reason provided"}`;

            if (
                user.banDuration &&
                user.banDuration > 0
            ) {

                banMessage +=
                    `\nExpires: (${user.banDuration} hours)`;

                return res.status(403).json({
                    error: banMessage
                });

            } else {

                banMessage += `\nExpires: Never`;

                return res.status(403).json({
                    error: banMessage
                });

            }
        }

        req.session.userId = user.id;

        try {

            await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content:
                        `**${user.username}** has logged into Pixelit`
                })
            });

        } catch (webhookError) {

            console.error(
                "Discord webhook failed:",
                webhookError
            );

        }

        return res.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {

        console.error("Login error:", err);

        return res.status(500).json({
            error: "Server error"
        });

    }
});

router.get("/loggedin", async (req, res) => {
    try {

        if (!req.session.userId) {
            return res.status(401).json({
                loggedIn: false
            });
        }

        const user = await User.findOne({
            id: req.session.userId
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                loggedIn: false
            });
        }

        return res.json({
            loggedIn: true,
            user
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Server error"
        });

    }
});

router.post("/logout", (req, res) => {
    const username = req.session.user ? req.session.user.username : "A user";

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Could not log out" });
        }

        res.clearCookie("pixelit.sid");

        const webhookUrl = "https://discord.com/api/webhooks/1507830658729508886/zEfOc7csDlDzpM__QtJaBWvBfdlztZPt2aNzcj0RwEpXRwjWAKro0WFmdvLS0YPs0iLK";
        
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `**${username}** has logged out of Pixelit`
            })
        }).catch(err => console.error("Discord Webhook failed:", err));

        return res.json({
            message: "Logged out"
        });
    });
});

module.exports = router;