const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../../models/User");

router.post("/", async (req, res) => {
    try {
        const session = req.session;
        const { currentPassword, newPassword } = req.body;

        if (!session || !session.userId) {
            return res.status(401).send("You must be logged in.");
        }

        const user = await User.findOne({ id: session.userId });
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).send("Incorrect old password.");
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).send("New password cannot be your old password.");
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedNewPassword
                }
            }
        );

        res.status(200).send("Password changed successfully.");

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;