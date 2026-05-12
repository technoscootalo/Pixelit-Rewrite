const express = require("express");
const User = require("../../models/User");

const router = express.Router();

const COOLDOWN_MS = 1000 * 60 * 60 * 4;
const DAILY_REWARDS = [
    { amount: 500, weight: 20 },
    { amount: 550, weight: 18 },
    { amount: 600, weight: 16 },
    { amount: 650, weight: 14 },
    { amount: 700, weight: 12 },
    { amount: 750, weight: 10 },
    { amount: 800, weight: 8 },
    { amount: 850, weight: 6 },
    { amount: 900, weight: 4 },
    { amount: 950, weight: 2 },
    { amount: 1000, weight: 1 },
];

function chooseDailyReward() {
    const totalWeight = DAILY_REWARDS.reduce((sum, reward) => sum + reward.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const reward of DAILY_REWARDS) {
        if (rand < reward.weight) {
            return reward.amount;
        }
        rand -= reward.weight;
    }

    return DAILY_REWARDS[DAILY_REWARDS.length - 1].amount;
}

router.post("/", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const user = await User.findOne({ id: req.session.userId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const now = new Date();
        if (user.lastClaim) {
            const nextClaim = new Date(user.lastClaim.getTime() + COOLDOWN_MS);
            if (nextClaim > now) {
                return res.status(429).json({
                    error: "Daily Wheel is not ready yet",
                    nextClaim: nextClaim.toISOString(),
                });
            }
        }

        const reward = chooseDailyReward();
        user.tokens += reward;
        user.lastClaim = now;
        await user.save();

        res.json({
            reward,
            tokens: user.tokens,
            nextClaim: new Date(now.getTime() + COOLDOWN_MS).toISOString(),
        });
    } catch (err) {
        console.error("Daily wheel claim error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
