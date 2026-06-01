const express = require("express");

const router = express.Router();

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