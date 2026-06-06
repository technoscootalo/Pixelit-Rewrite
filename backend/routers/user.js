const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        if (!req.session.userId) { 
            return res.redirect('/'); 
        }


        const user = await User.findOne({
            id: req.session.userId
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json(user);

    } catch (err) {
        console.error("User fetch error:", err);

        res.status(500).json({
            error: "Server error"
        });
    }
});

module.exports = router;
