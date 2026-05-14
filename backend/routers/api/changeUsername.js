const express = require("express");
const router = express.Router();

const User = require("../../models/User");

router.post("/changeUsername", async (req, res) => {
    const session = req.session;
    const { newUsername, password } = req.body;

    if (!session.loggedIn) {
        return res.status(401).send("You must be logged in to change your username.");
    }

    const user = await users.findOne({ username: session.username });

    if (user && await validatePassword(password, user.password)) {
        const normalizedNewUsername = newUsername.toLowerCase();

        const existingUser = await users.findOne({ username: normalizedNewUsername });

        if (existingUser) {
            return res.status(400).send("Username already exists.");
        }

        const normalizedCurrentUsername = user.username.toLowerCase();
        if (normalizedCurrentUsername === normalizedNewUsername) {
            return res.status(400).send("New username cannot be the same as the current username (case-insensitive).");
        }

        await users.updateOne(
            { _id: user._id },
            { $set: { username: newUsername } }
        );
        req.session.username = newUsername; 
        res.status(200).send("Username changed successfully.");
    } else {
        res.status(401).send("Incorrect password.");
    }
});

module.exports = router;