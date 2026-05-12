const express = require("express");
const router = express.Router();

const Pack = require("../../models/Pack");
const User = require("../../models/User");


// GET ALL PACKS
router.get("/", async (req, res) => {
    try {
        const packs = await Pack.find({ visible: true });

        res.json(packs);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch packs"
        });
    }
});


// OPEN PACK
router.post("/open/:packName", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Not logged in"
            });
        }

        const user = await User.findOne({
            id: req.session.userId
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const pack = await Pack.findOne({
            name: req.params.packName
        });

        if (!pack) {
            return res.status(404).json({
                error: "Pack not found"
            });
        }

        if (user.tokens < pack.cost) {
            return res.status(400).json({
                error: "Not enough tokens"
            });
        }

        user.tokens -= pack.cost;
        user.packs += 1;

        // weighted random blook selection
        const random = Math.random() * 100;
        let current = 0;
        let wonBlook = null;

        for (const blook of pack.blooks) {
            current += blook.chance;

            if (random <= current) {
                wonBlook = blook;
                break;
            }
        }

        await user.save();

        res.json({
            success: true,
            blook: wonBlook,
            tokens: user.tokens
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to open pack"
        });
    }
});

module.exports = router;