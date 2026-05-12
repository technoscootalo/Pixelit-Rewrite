const express = require("express");

const router = express.Router();

// * ts just so the frontend calls and checks if the users logged in

router.get("/loggedin", (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            loggedIn: false
        });
    }

    return res.json({
        loggedIn: true,
        user: req.session.user
    });
});

module.exports = router;