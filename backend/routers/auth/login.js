const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Missing fields"
            });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({
                error: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                error: "Invalid credentials"
            });
        }

        if (user.banned) {
            let banMessage = `You have been banned from Pixelit\nReason: ${user.banReason || "No reason provided"}`;

            if (user.banDuration && user.banDuration > 0) {

                banMessage += `\nExpires: (${user.banDuration} hours)`;

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
    req.session.destroy(() => {
        res.clearCookie("pixelit.sid");

        return res.json({
            message: "Logged out"
        });
    });
});

module.exports = router;