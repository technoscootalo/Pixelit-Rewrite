module.exports = function registerGlobalNotificationSocket({ io, Message, User }) {
  if (!io) throw new Error("globalSocket: missing io");

  io.on("connection", (socket) => {
    socket.on("globalNotification:send", async (payload) => {
      try {
        if (!payload || typeof payload !== "object") return;
        const content = typeof payload.content === "string" ? payload.content.trim() : "";
        if (!content) return;

        if (content.length > 500) return;

        const sessionUserId = socket.request?.session?.userId;
        if (!sessionUserId) return;

        if (User) {
          const user = await User.findOne({ id: sessionUserId }).select("-password");
          if (!user) return;
          const roles = user.roles || user.role || user.permissions || [];
          const rolesArr = Array.isArray(roles) ? roles : [roles].filter(Boolean);

          const DEV_LIKE = ["Developer", "Owner"];
          const ok = rolesArr.some((r) => {
            const s = String(r).toLowerCase();
            return DEV_LIKE.some((d) => s.includes(d));
          });

          if (rolesArr.length && !ok) return;

        }

        const username = socket.request?.session?.username || "Global";

        const msg = {
          userId: sessionUserId,
          username,
          pfp: null,
          badges: [],
          content,
          createdAt: new Date(),
          _id: undefined,
          isGlobal: true,
        };

        // Push to all connected users.
        io.emit("inbox:new", msg);

      } catch (e) {
        console.error("globalNotification send failed:", e);
      }
    });
  });
};

