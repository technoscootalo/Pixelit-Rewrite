const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); 
const User = require("../../models/User");
const BazaarListing = require("../../models/BazaarListing");
const Blook = require("../../models/Blook"); 
const webhookUrl = "https://discord.com/api/webhooks/1510852018514694255/6F68Xglo98yr5pYOihzLKOHn20OzPsgGnCJzUEgsrxJAdN7aLjqBSChdjlXw7Tx457j9";

router.post('/listBlook', async (req, res) => {
  const { blookName, price } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.status(401).json({ error: "Not logged in" });

  if (typeof price !== 'number' || price < 1 || price > 5000000) {
    return res.status(400).json({ error: "Price must be between 1 and 5,000,000" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const blook = await Blook.findOne({ blookName: blookName });
    if (!blook) throw new Error("Blook not found in database");

    const updatePath = `blooks.${blookName}`;
    const user = await User.findOneAndUpdate(
      { id: userId, [updatePath]: { $gte: 1 } },
      { $inc: { [updatePath]: -1 } },
      { session, new: true }
    );

    if (!user) throw new Error("You don't own this blook");

    await BazaarListing.create([{
      userId: userId,
      username: user.username,
      blookName: blookName,
      imageUrl: blook.imageUrl, 
      price: price
    }], { session });

    await session.commitTransaction();
    
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**${user.username}** has listed **${blookName}** for **${price.toLocaleString()}** tokens on the bazaar!`
      })
    }).catch(err => console.error("Discord Webhook failed:", err));

    res.json({ success: true });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;