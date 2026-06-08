const express = require("express");
const router = express.Router();
const Blook = require("../../models/Blook");
const { requireDeveloperAccess } = require("../../middleware/panelAuth");

router.get("/", async (req, res) => {
  if (req.headers["sec-fetch-mode"] === "navigate") {
    const backUrl = req.headers["referer"] || "/";

    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="preconnect" href="https://googleapis.com">
          <link rel="preconnect" href="https://gstatic.com" crossorigin>

          <link rel="stylesheet" href="https://cloudflare.com" 
              integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
              crossorigin="anonymous" 
              referrerpolicy="no-referrer"
          />

          <link href="https://googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap" rel="stylesheet">
          <link rel="icon" type="image/png" href="https://github.io">

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
    const blooks = await Blook.find();
    return res.json(blooks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.post("/create", requireDeveloperAccess(), async (req, res) => {

  try {
    const blook = new Blook(req.body);
    await blook.save();

    res.json({ success: true, blook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", requireDeveloperAccess(), async (req, res) => {

  try {
    const updated = await Blook.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", requireDeveloperAccess(), async (req, res) => {

  try {
    await Blook.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;