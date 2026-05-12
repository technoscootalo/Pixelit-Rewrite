const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("pixelit.sid");

        return res.json({
            message: "Logged out"
        });
    });
});

module.exports = router;