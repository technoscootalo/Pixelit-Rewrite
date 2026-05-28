require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const path = require("path");
const session = require("express-session");

const connectDB = require("./backend/utils/db");
const User = require("./backend/models/User");
const Message = require("./backend/models/Messages");
const Emoji = require("./backend/models/Emojis.js");

const pages = require("./backend/routers/pages");
const registerRoute = require("./backend/routers/auth/register");
const loginRoute = require("./backend/routers/auth/login");
const loggedinRoute = require("./backend/routers/auth/loggedin");
const logoutRoute = require("./backend/routers/auth/logout");
const userRoutes = require("./backend/routers/user");
const packsRouter = require("./backend/routers/api/packs");
const changePfpRoute = require("./backend/routers/api/changePfp");
const messagesRoute = require("./backend/routers/api/messages");
const inboxRoute = require("./backend/routers/api/inbox");
const leaderboardRoute = require("./backend/routers/api/leaderboard");
const dailyWheelRoute = require("./backend/routers/api/dailyWheel");
const viewUserRoute = require("./backend/routers/api/viewUser");
const blookRoutes = require("./backend/routers/api/blooks");
const changeUsernameRoute = require("./backend/routers/api/changeUsername");
const changePasswordRouter = require("./backend/routers/api/changePassword"); 
const reportUserRoute = require("./backend/routers/api/reportUser");
const badgeRoutes = require("./backend/routers/api/badges");
const bannerRoutes = require("./backend/routers/api/banners");
const usersRoutes = require("./backend/routers/api/users");
const packRouter = require("./backend/routers/api/pack");
const moderationReportsRoute = require("./backend/routers/api/moderationReports");
const articlesRoute = require("./backend/routers/api/articles");
const blooksRoutes = require("./backend/routers/users/blooks");
const userBlooksRoutes = require("./backend/routers/api/userBlooks");
const sellBlookRoute = require("./backend/routers/users/sellBlook");
const giftBlookRoute = require("./backend/routers/users/giftBlook");
const paypalWebhookRouter = require('./backend/routers/api/paypalWebhook')

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

connectDB();

const sessionMiddleware = session({
    name: "pixelit.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/blooks", blookRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user/daily-wheel", dailyWheelRoute);
app.use("/api/packs", packsRouter);
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/loggedin", loggedinRoute);
app.use("/api/logout", logoutRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/inbox", inboxRoute);
app.use("/api/viewUser", viewUserRoute);
app.use("/api/leaderboard", leaderboardRoute);
app.use("/api/changePassword", changePasswordRouter);
app.use("/api/changeUsername", changeUsernameRoute);
app.use("/api/user", changePfpRoute);
app.use("/api/reportUser", reportUserRoute);
app.use("/api/moderationReports", moderationReportsRoute);
app.use("/api/badges", badgeRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/packs", packRouter);
app.use("/api/articles", articlesRoute);
app.use("/api/users", blooksRoutes);
app.use("/api/users/sell-blook", sellBlookRoute);
app.use("/api/users/gift-blook", giftBlookRoute);
app.use("/api/userBlooks", userBlooksRoutes);
app.use('/api/boosters/paypal/webhook', paypalWebhookRouter);
app.use("/", pages);

app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "src/views/404.html"));
});

const allowedCorsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: allowedCorsOrigin,
        credentials: true,
    },
});

app.locals.io = io;

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const onlineUsers = new Map();

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

        const count = onlineUsers.size;
        io.emit("presence:update", { onlineCount: count });

        socket.emit("initClient", { username: user.username, userId: user.id.toString() });

        if (user.username) {
            socket.join(`user:${user.username}`);
        }


        try {
            const currentEmotes = await Emoji.find({}, "name imageUrl");
            socket.emit("emotesList", currentEmotes);
        } catch (dbErr) {
            console.error("Failed loading container emotes for picker:", dbErr);
            socket.emit("emotesList", []);
        }

        const recentMessages = await Message.find({})
            .sort({ createdAt: -1 })
            .limit(1000)
            .lean();

        socket.emit("chatHistory", recentMessages.reverse());

        socket.on("chatMessage", async (payload) => {
            if (!payload || typeof payload.content !== "string") return;

            let content = payload.content.trim();
            if (!content) return;

            const emoteRegex = /:([a-zA-Z0-9_\-]+):/g;
            const textMatches = [...content.matchAll(emoteRegex)];

            if (textMatches.length > 0) {
                const targetedNames = [...new Set(textMatches.map(m => m[1]))];
                const matchedDbEmotes = await Emoji.find({ name: { $in: targetedNames } });

                const mapLookup = {};
                matchedDbEmotes.forEach(e => {
                    mapLookup[e.name] = e.imageUrl;
                });

                content = content.replace(emoteRegex, (fullMatch, tokenName) => {
                    if (mapLookup[tokenName]) {
                        return `<img src="${mapLookup[tokenName]}" class="chat-custom-emoji" alt=":${tokenName}:" title=":${tokenName}:" style="width: 32px; height: 32px; vertical-align: middle; object-fit: contain; margin: 0 2px;" />`;
                    }
                    return fullMatch; 
                });
            }

            const earnedTokens = Math.floor(Math.random() * 5) + 1;

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
                replyToContent: payload.replyToContent || null
            });

            io.emit("chatMessage", savedMessage);
        });

        socket.on("editMessage", async ({ messageId, content }) => {
            if (!messageId || typeof content !== "string" || !content.trim()) return;

            const message = await Message.findById(messageId);
            if (!message || message.userId !== socket.user.id.toString()) return;

            let updatedContent = content.trim();

            const emoteRegex = /:([a-zA-Z0-9_\-]+):/g;
            const textMatches = [...updatedContent.matchAll(emoteRegex)];

            if (textMatches.length > 0) {
                const targetedNames = [...new Set(textMatches.map(m => m[1]))];
                const matchedDbEmotes = await Emoji.find({ name: { $in: targetedNames } });

                const mapLookup = {};
                matchedDbEmotes.forEach(e => {
                    mapLookup[e.name] = e.imageUrl;
                });

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


httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});