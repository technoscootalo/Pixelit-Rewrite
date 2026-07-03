const User = require("../../backend/models/User");

/**
 * 
 *
 * @param {import('socket.io').Server} io
 * @param {Map<string, { username: string }>} onlineUsers
 */

function setupPresence(io, onlineUsers) {
  const LAST_ONLINE_UPDATE_MS = 1000; 

  io.on("connection", async (socket) => {
    const session = socket.request.session;

    if (!session || !session.userId) {
      return socket.disconnect(true);
    }

    try {
      const user = await User.findOne({ id: session.userId }).select("-password");
      if (!user) return socket.disconnect(true);

      socket.user = user;

      const uid = user.id.toString();
      if (!onlineUsers.has(uid)) {
        onlineUsers.set(uid, { username: user.username });
      }

      io.emit("presence:update", { onlineCount: onlineUsers.size });
      socket.emit("presence:init", {
        onlineCount: onlineUsers.size,
        userId: uid,
        username: user.username,
      });

      const heartbeatOnce = () => {
        User.updateOne({ id: user.id }, { $set: { lastOnline: new Date() } }).catch(() => {});
      };

      heartbeatOnce();
      const lastOnlineInterval = setInterval(heartbeatOnce, LAST_ONLINE_UPDATE_MS);

      socket.on("disconnect", () => {
        clearInterval(lastOnlineInterval);

        if (onlineUsers.has(uid)) {
          onlineUsers.delete(uid);
          io.emit("presence:update", { onlineCount: onlineUsers.size });
        }
      });
    } catch (err) {
      console.error("Presence socket connection error:", err);
      socket.disconnect(true);
    }
  });
}

module.exports = { setupPresence };