const express = require("express");
const router = express.Router();
const Pack = require("../../models/Pack");
const User = require("../../models/User");
const { rateLimit } = require("../../middleware/rateLimit");
const DISCORD_WEBHOOK_PACK_OPEN = process.env.DISCORD_WEBHOOK_PACK_OPEN;

router.get("/", async (req, res) => {
  if (req.headers["sec-fetch-mode"] === "navigate") {
    const backUrl = req.headers["referer"] || "/";

    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
              integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
              crossorigin="anonymous" 
              referrerpolicy="no-referrer"
          />

          <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap" rel="stylesheet">
          <link rel="icon" type="image/png" href="https://izumiihd.github.io/pixelitcdn/assets/img/favicon.ico">

          <meta http-equiv="refresh" content="3;url=${backUrl}">
          <title>alr bro</title>
          
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap');

            body {
              margin: 0;
              padding: 0;
              background: #6f0083;
              color: white;
              font-family: 'Pixelify Sans', sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              overflow: hidden;
            }

            .background {
              position: fixed;
              width: 250%;
              height: 250%;
              top: 50%;
              left: 50%;
              z-index: -1;
              background-size: 550px;
              background-position: -100px -100px;
              background-image: url('https://izumiihd.github.io/pixelitcdn/assets/background.png');
              transform: translate(-50%, -50%) rotate(15deg);
              opacity: 0.1;
            }

            .message {
              font-size: 2.5rem;
              text-align: center;
              margin-bottom: 15px;
            }

            .countdown {
              font-size: 1.8rem;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="background"></div>
          
          <div class="message">nice try loser, fucking redirect 😂😂</div>
          <div class="countdown">Redirecting in <span id="timer">3</span>s...</div>

          <script>
            let timeLeft = 3;
            const timerElement = document.getElementById('timer');

            const countdownInterval = setInterval(() => {
              timeLeft -= 1;
              timerElement.textContent = timeLeft;
              if (timeLeft <= 0) {
                clearInterval(countdownInterval);
              }
            }, 1000);

            setTimeout(() => {
              window.location.href = "${backUrl}";
            }, 3000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    const packs = await Pack.find({ visible: true }).populate("blooks");
    return res.json(packs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch packs" });
  }
});

router.post(
  "/open/:packName",
  rateLimit({ max: 10, windowMs: 8000 }),
  async (req, res) => {
    try {
      const packName = req.params.packName?.trim();
      if (!packName) return res.status(400).json({ error: "Invalid pack name" });

      if (!global.packCache) global.packCache = {};
      let pack = global.packCache[packName];

      if (!pack) {
        pack = await Pack.findOne({ name: packName }).populate("blooks").lean();
        if (pack) global.packCache[packName] = pack;
      }

      if (!pack || !pack.visible || !pack.blooks?.length) {
        return res.status(404).json({ error: "Pack unavailable" });
      }

      const UserBooster = require("../../models/UserBooster");
      const boosterAgg = await UserBooster.find({
        userId: req.session.userId,
        status: "active",
        expiresAt: { $gt: new Date() }
      }).lean();




      let finalMultiplier = 1;
      if (boosterAgg && boosterAgg.length > 0) {
        const boosterIds = [...new Set(boosterAgg.map((u) => String(u.boosterId)))];
        const Booster = require("../../models/Booster");
        const boosters = await Booster.find({ _id: { $in: boosterIds }, visible: true })
          .select("multiplier")
          .lean();
        const mults = boosters.map((b) => Number(b.multiplier) || 1);
        finalMultiplier = mults.reduce((acc, m) => acc * m, 1);
      }

      const totalChance = pack.blooks.reduce(
        (sum, b) => sum + (Number(b.chance) || 0) * finalMultiplier,
        0
      );
      const roll = Math.random() * totalChance;

      let current = 0;
      let wonBlook = pack.blooks[0];
      for (const blook of pack.blooks) {
        current += (Number(blook.chance) || 0) * finalMultiplier;
        if (roll <= current) {
          wonBlook = blook;
          break;
        }
      }


      const blookName = (wonBlook.name || wonBlook.title || wonBlook.blookName || "Unknown")
        .replace(/\./g, "_");

      const updatedUser = await User.findOneAndUpdate(
        { id: req.session.userId, tokens: { $gte: pack.cost } },
        {
          $inc: {
            tokens: -pack.cost,
            packs: 1,
            opened: 1,
            [`blooks.${blookName}`]: 1
          }
        },
        { returnDocument: 'after', projection: "username tokens packs blooks" }
      );

      if (!updatedUser) return res.status(400).json({ error: "Not enough tokens" });

      const adjustedChance = Number(wonBlook?.chance) * finalMultiplier;

      res.json({
        success: true,
        blook: {
          ...wonBlook,
          adjustedChance,
        },
        tokens: updatedUser.tokens,
        packs: updatedUser.packs,
        blooks: updatedUser.blooks,
      });


      const rarity = (wonBlook.rarity || wonBlook.rarityName || "").toString().toLowerCase();
      if (["legendary", "chroma", "mystical"].includes(rarity) && DISCORD_WEBHOOK_PACK_OPEN) {
        fetch(DISCORD_WEBHOOK_PACK_OPEN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `**${updatedUser.username}** opened **${pack.name}** and got a **${blookName}**`
          }),
        }).catch(console.error);
      }

    } catch (err) {
      console.error("Pack Open Error:", err);
      return res.status(500).json({ error: "Failed to open pack" });
    }
  }
);

module.exports = router;
