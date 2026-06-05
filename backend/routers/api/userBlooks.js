const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Pack = require("../../models/Pack");

router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const user = await User.findOne({ id: req.session.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const packs = await Pack.find({}).populate("blooks");



    const MISC_PACK_ID = "6a2239b7b6623c0c0b5e8502";

    const formattedPacks = packs
      .map((pack) => {
        const isMisc = String(pack._id) === MISC_PACK_ID;

        const blooks = (pack.blooks || [])
          .map((blook) => {
            const ownedAmount = user.blooks ? (user.blooks[blook.blookName] || 0) : 0;
            return {
              name: blook.blookName,
              rarity: blook.rarity,
              imageUrl: blook.imageUrl,
              backgroundUrl: blook.backgroundUrl,
              owned: ownedAmount
            };
          })
          .filter((b) => (isMisc ? b.owned > 0 : true));

        return {
          name: pack.name,
          visible: !!pack.visible,
          blooks
        };
      })
      .filter((pack) => (String(pack._id) === MISC_PACK_ID ? pack.blooks.length > 0 : true));



    res.json({ packs: formattedPacks });
  } catch (err) {
    console.error("userBlooks route error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;