const { Server: SocketIOServer } = require("socket.io");

const User = require("../../backend/models/User");
const Message = require("../../backend/models/Messages");
const Emoji = require("../../backend/models/Emojis.js");

/**
 * Wire socket chat events
 *
 * @param {import('socket.io').Server} io
 * @param {Map<string, {username: string}>} onlineUsers
 *
 */

function setupChat(io, onlineUsers) {
  const emojiNameToUrl = new Map();
  let emotesLoaded = false;

  async function loadEmotesToCache() {
    try {
      const currentEmotes = await Emoji.find({}, "name imageUrl").lean();
      emojiNameToUrl.clear();
      currentEmotes.forEach((e) => {
        if (e?.name && e?.imageUrl) emojiNameToUrl.set(e.name, e.imageUrl);
      });
      emotesLoaded = true;
    } catch (dbErr) {
      console.error("Failed loading emotes for chat cache:", dbErr);
      emotesLoaded = true; 
    }
  }

  loadEmotesToCache();

  io.on("connection", async (socket) => {
    const session = socket.request.session;

    if (!session || !session.userId) {
      return socket.disconnect(true);
    }

    try {
      const user = await User.findOne({ id: session.userId }).select("-password");
      if (!user) {
        return socket.disconnect(true);
      }

      socket.user = user;

      if (!onlineUsers.has(user.id.toString())) {
        onlineUsers.set(user.id.toString(), { username: user.username });
      }

      io.emit("presence:update", { onlineCount: onlineUsers.size });
      socket.emit("initClient", { username: user.username, userId: user.id.toString() });

      if (user.username) {
        socket.join(`user:${user.username}`);
      }

      if (emojiNameToUrl.size > 0) {
        const emotesList = Array.from(emojiNameToUrl.entries()).map(([name, imageUrl]) => ({ name, imageUrl }));
        socket.emit("emotesList", emotesList);
      } else {
        try {
          const currentEmotes = await Emoji.find({}, "name imageUrl").lean();
          currentEmotes.forEach((e) => {
            if (e?.name && e?.imageUrl) emojiNameToUrl.set(e.name, e.imageUrl);
          });
          socket.emit("emotesList", currentEmotes);
        } catch (dbErr) {
          console.error("Failed loading container emotes for picker:", dbErr);
          socket.emit("emotesList", []);
        }
      }

      const recentMessages = await Message.find({})
        .sort({ createdAt: -1 })
        .limit(150)
        .lean();

      socket.emit("chatHistory", recentMessages.reverse());

      socket.emit("chatMuteState", {
        muted: !!socket.user.muted,
        muteReason: socket.user.muteReason || "No Reason Provided",
        muteDuration: socket.user.muteDuration ?? 0,
        userId: socket.user.id?.toString?.() || socket.user.id,
      });

      socket.on("chatMessage", async (payload) => {
        if (socket.user.muted) {
          return;
        }

        if (!payload || typeof payload.content !== "string") return;

        let content = payload.content.trim();
        if (!content) return;

        if (/[<>{}]/.test(content) || /on\w+\s*=|javascript:/i.test(content)) {
          return;
        }

        const emoteRegex = /:([a-zA-Z0-9_\-]+):/g;
        const textMatches = [...content.matchAll(emoteRegex)];

        if (textMatches.length > 0) {
          const targetedNames = [...new Set(textMatches.map((m) => m[1]))];

          const mapLookup = {};
          for (const tokenName of targetedNames) {
            const url = emojiNameToUrl.get(tokenName);
            if (url) mapLookup[tokenName] = url;
          }

          content = content.replace(emoteRegex, (fullMatch, tokenName) => {
            if (mapLookup[tokenName]) {
              return `<img src="${mapLookup[tokenName]}" class="chat-custom-emoji" alt=":${tokenName}:" title=":${tokenName}:" style="width: 32px; height: 32px; vertical-align: middle; object-fit: contain; margin: 0 2px;" />`;
            }
            return fullMatch;
          });
        }

        const earnedTokens = Math.floor(Math.random() * 6) + 10;

        await User.findOneAndUpdate(
          { id: socket.user.id },
          { $inc: { sent: 1, tokens: earnedTokens } },
          { new: true }
        );

        const savedMessage = await Message.create({
          userId: socket.user.id.toString(),
          username: socket.user.username,
          pfp: socket.user.pfp,
          badges: socket.user.badges || [],
          content,
          replyToId: payload.replyToId || null,
          replyToUser: payload.replyToUser || null,
          replyToContent: payload.replyToContent || null,
        });

        io.emit("chatMessage", savedMessage);
      });

      socket.on("editMessage", async ({ messageId, content }) => {
        if (!messageId || typeof content !== "string" || !content.trim()) return;

        const message = await Message.findById(messageId);
        if (!message || message.userId !== socket.user.id.toString()) return;

        let updatedContent = content.trim();
        if (!updatedContent) return;

        if (updatedContent.length > 256) return;
        if (/[<>"'`]/.test(updatedContent)) return;
        if (/on\w+\s*=|javascript:/i.test(updatedContent)) return;

        const emoteRegex = /:([a-zA-Z0-9_\-]+):/g;
        const textMatches = [...updatedContent.matchAll(emoteRegex)];

        if (textMatches.length > 0) {
          const targetedNames = [...new Set(textMatches.map((m) => m[1]))];

          const mapLookup = {};
          for (const tokenName of targetedNames) {
            const url = emojiNameToUrl.get(tokenName);
            if (url) mapLookup[tokenName] = url;
          }

          updatedContent = updatedContent.replace(emoteRegex, (fullMatch, tokenName) => {
            if (mapLookup[tokenName]) {
              return `<img src="${mapLookup[tokenName]}" class="chat-custom-emoji" alt=":${tokenName}:" title=":${tokenName}:" style="width: 32px; height: 32px; vertical-align: middle; object-fit: contain; margin: 0 2px;" />`;
            }
            return fullMatch;
          });
        }

        message.content = updatedContent;
        message.edited = true;
        await message.save();

        io.emit("messageEdited", { messageId: message._id, content: message.content });
      });

      socket.on("deleteMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await Message.findById(messageId);
        if (!message || message.userId !== socket.user.id.toString()) return;

        await Message.deleteOne({ _id: messageId });
        io.emit("messageDeleted", { messageId });
      });
    } catch (err) {
      console.error("Socket connection error:", err);
      socket.disconnect(true);
    }

    socket.on("disconnect", () => {
      try {
        const uid = socket.user?.id?.toString?.() || socket.user?.id;
        if (uid && onlineUsers.has(uid)) {
          onlineUsers.delete(uid);
          io.emit("presence:update", { onlineCount: onlineUsers.size });
        }
      } catch (e) {
        console.error("disconnect presence error:", e);
      }
    });
  });
}

module.exports = { setupChat };