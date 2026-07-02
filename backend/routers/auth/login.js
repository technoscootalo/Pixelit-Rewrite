const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../../models/User");
const IPBlacklist = require("../../models/IPBlacklist");
const { rateLimit } = require("../../middleware/rateLimit");

const router = express.Router();
const DISCORD_WEBHOOK_AUTH = process.env.DISCORD_WEBHOOK_AUTH;

router.post(
  "/",
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
    }
  }),
  async (req, res) => {
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

        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        const hashedIp = crypto.createHash("sha256").update(ip).digest("hex");

        const blacklistEntry = await IPBlacklist.findOne({
            hashedIp,
            active: true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        });
        if (blacklistEntry) {
            return res.status(403).json({
                error: "Your IP address has been blacklisted. If you believe this is a mistake, please contact a staff member."
            });
        }

        if (user.banned) {
            const reason = user.banReason || "no reason provided";
            const duration = (user.banDuration && user.banDuration > 0) 
                ? `in ${user.banDuration} hours` 
                : "never";

            const banMessage = `You are currently banned for ${reason}. Your ban will expire ${duration}. If you believe this is a mistake, please contact a staff member.`;

            return res.status(403).json({
                error: banMessage
            });
        }

        req.session.userId = user.id;

        try {
            if (DISCORD_WEBHOOK_AUTH) {
                await fetch(DISCORD_WEBHOOK_AUTH, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        content:
                            `**${user.username}** has logged into Pixelit`
                    })
                });
            }

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

router.post("/logout", async (req, res) => {
    try {
        let username = "A user";

        if (req.session.userId) {
            const user = await User.findOne({ id: req.session.userId });
            if (user) {
                username = user.username;
            }
        }

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Could not log out" });
            }

            res.clearCookie("pixelit.sid");

            if (DISCORD_WEBHOOK_AUTH) {
                fetch(DISCORD_WEBHOOK_AUTH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `**${username}** has logged out of Pixelit`
                    })
                }).catch(err => console.error("Discord Webhook failed:", err));
            }

            return res.json({
                message: "Logged out"
            });
        });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;