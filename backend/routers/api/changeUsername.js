const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../../models/User");

router.post("/", async (req, res) => {
    try {
        const session = req.session;
        const { newUsername, password } = req.body;

        if (!session.loggedIn) {
            return res.status(401).send("You must be logged in.");
        }

        const user = await User.findOne({
            username: session.username
        });

        if (!user) {
            return res.status(404).send("User not found.");
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).send("Incorrect password.");
        }

        const normalizedNewUsername = newUsername.toLowerCase();

        const existingUser = await User.findOne({
            username: normalizedNewUsername
        });

        if (existingUser) {
            return res.status(400).send("Username already exists.");
        }

        if (
            user.username.toLowerCase() === normalizedNewUsername
        ) {
            return res.status(400).send(
                "New username cannot be the same."
            );
        }

        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    username: newUsername
                }
            }
        );

        req.session.username = newUsername;

        res.status(200).send("Username changed successfully.");

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;