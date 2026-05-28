const express = require("express");
const router = express.Router();

const User = require("../../models/User");

router.get("/", async (req, res) => {
  try {
    const sessionUserId = req.session?.userId;
    if (!sessionUserId) return res.status(401).json({ error: "Not logged in" });

    const recipient = await User.findOne({ id: sessionUserId }).select("inbox username");
    if (!recipient) return res.status(401).json({ error: "Not logged in" });

    const messages = Array.isArray(recipient.inbox) ? recipient.inbox : [];

    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ messages });
  } catch (e) {
    console.error("inbox get error:", e);
    return res.status(500).json({ error: "Failed to load inbox" });
  }
});

router.post("/test", async (req, res) => {
  try {
    const { recipientUsername, content, sendAll } = req.body || {};

    const sessionUserId = req.session?.userId;
    if (!sessionUserId) return res.status(401).json({ error: "Not logged in" });

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Missing content" });
    }

    const sender = await User.findOne({ id: sessionUserId }).select("id username pfp");
    if (!sender) return res.status(401).json({ error: "Not logged in" });

    const trimmedContent = content.trim();

    if (sendAll) {
      const allUsers = await User.find({}).select("username pfp id").lean();

      const defaultPfp = "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";

      const payload = {
        senderUsername: sender.username,
        content: trimmedContent,
        pfp: defaultPfp,
        createdAt: new Date(),
      };

      const updatePromises = allUsers.map((u) => {
        return User.findOneAndUpdate(
          { id: u.id },
          {
            $push: {
              inbox: {
                ...payload,
                pfp: "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
              },
            },
          },
          { new: true }
        );
      });

      await Promise.all(updatePromises);

      for (const u of allUsers) {
        req.app?.locals?.io?.to(`user:${u.username}`).emit("inbox:new", {
          ...payload,
        });
      }

      return res.json({ success: true, sentTo: allUsers.length });
    }

    if (!recipientUsername || typeof recipientUsername !== "string") {
      return res.status(400).json({ error: "Missing recipientUsername" });
    }

    const recipient = await User.findOneAndUpdate(
      { username: new RegExp(`^${recipientUsername.trim()}$`, "i") },
      {
        $push: {
          inbox: {
              senderUsername: sender.username,
              content: trimmedContent,
              pfp: "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
              createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!recipient) return res.status(404).json({ error: "Recipient not found" });

    req.app?.locals?.io?.to(`user:${recipient.username}`).emit("inbox:new", {
      senderUsername: sender.username,
      content: trimmedContent,
      pfp: "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png",
      createdAt: new Date(),
    });

    return res.json({ success: true });
  } catch (e) {
    console.error("inbox test route error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { recipientUsername, content } = req.body;
  const sender = await User.findOne({ id: req.session.userId });

  const defaultPfp = "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";

  if (!sender) return res.status(401).json({ error: "Not logged in" });

  const recipient = await User.findOneAndUpdate(
    { username: new RegExp(`^${recipientUsername.trim()}$`, "i") },
    {
      $push: {
        inbox: {
          senderUsername: sender.username,
          content,
          pfp: defaultPfp,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!recipient) return res.status(404).json({ error: "Recipient not found" });

  req.app.locals.io.to(`user:${recipient.username}`).emit("inbox:new", {
    senderUsername: sender.username,
    content,
    pfp: defaultPfp,
    createdAt: new Date(),
  });

  return res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
  try {
    const sessionUserId = req.session?.userId;
    if (!sessionUserId) return res.status(401).json({ error: "Not logged in" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const user = await User.findOne({ id: sessionUserId }).select("inbox");
    if (!user) return res.status(404).json({ error: "User not found" });

    const inbox = Array.isArray(user.inbox) ? user.inbox : [];

    const beforeLen = inbox.length;
    const filtered = inbox.filter((item) => {
      const itemId = item._id ? String(item._id) : null;
      return itemId ? itemId !== String(id) : true;
    });

    if (filtered.length === beforeLen) {
      return res.status(404).json({ error: "Notification not found" });
    }

    user.inbox = filtered;
    await user.save();

    return res.json({ success: true });
  } catch (e) {
    console.error("inbox delete error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

