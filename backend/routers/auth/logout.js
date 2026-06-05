const express = require("express");
const User = require("../../models/User");

const router = express.Router();
const DISCORD_WEBHOOK_AUTH = process.env.DISCORD_WEBHOOK_AUTH;

router.post("/logout", async (req, res) => {
    let username = "A user";

    if (req.session.userId) {
        const user = await User.findOne({ id: req.session.userId });
        if (user?.username) {
            username = user.username;
        }
    } else if (req.session.user?.username) {
        username = req.session.user.username;
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
});

module.exports = router;