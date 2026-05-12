const express = require("express");
const User = require("../../models/User");

const router = express.Router();
 
router.get("/", async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.json({
                loggedIn: false
            });
        }

        const user = await User.findOne({ id: req.session.userId }).select("-password");

        if (!user) {
            return res.json({
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

module.exports = router;