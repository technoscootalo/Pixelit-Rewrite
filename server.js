require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const path = require("path");
const session = require("express-session");

const connectDB = require("./backend/utils/db");
const User = require("./backend/models/User");
const Message = require("./backend/models/Messages");
const pages = require("./backend/routers/pages");
const registerRoute = require("./backend/routers/auth/register");
const loginRoute = require("./backend/routers/auth/login");
const loggedinRoute = require("./backend/routers/auth/loggedin");
const logoutRoute = require("./backend/routers/auth/logout");
const userRoutes = require("./backend/routers/user");
const packsRouter = require("./backend/routers/api/packs");
const weeklyMarketRoute = require("./backend/routers/api/weeklyMarket");
const changePfpRoute = require("./backend/routers/api/changePfp");
const messagesRoute = require("./backend/routers/api/messages");
const leaderboardRoute = require("./backend/routers/api/leaderboard");
const dailyWheelRoute = require("./backend/routers/api/dailyWheel");
const viewUserRoute = require("./backend/routers/api/viewUser");
const blookRoutes = require("./backend/routers/api/blooks");
const changeUsernameRoute = require("./backend/routers/api/changeUsername");
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
const weeklyMarketRoutes = require("./backend/routers/api/weeklyMarket");

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
app.use("/api/weekly/market", weeklyMarketRoute);
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/loggedin", loggedinRoute);
app.use("/api/logout", logoutRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/leaderboard", leaderboardRoute);
app.use("/api/viewUser", viewUserRoute);
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
app.use("/api/weekly", weeklyMarketRoutes);
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

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

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

        const recentMessages = await Message.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        socket.emit("chatHistory", recentMessages.reverse());
        
        socket.on('joinUserRoom', ({ username }) => {
            if (!username || typeof username !== 'string') return;
            socket.join(`user:${username}`);
        });

        socket.on('tradeRequest', ({ sender, recipient }) => {
            if (!sender || !recipient) return;
            if (sender === recipient) return;

            const trade = tradeStore.createTrade({ sender, recipient });

            io.to(`user:${recipient}`).emit('tradeRequest', {
                sender,
                recipient,
                tradeId: trade.tradeId,
            });
        });



        socket.on('joinTradeRoom', ({ tradeId, username }) => {
            if (!tradeId || typeof tradeId !== 'string') return;
            if (!username || typeof username !== 'string') return;
            socket.join(`trade:${tradeId}`);
        });



        socket.on('tradeResponse', ({ sender, recipient, accepted, tradeId }) => {

            if (!sender || !recipient || typeof accepted !== 'boolean') return;

            const targetTrade = tradeId
                ? tradeStore.getTrade(tradeId)
                : null;

            const trade = targetTrade || Array.from((tradeStore.trades || new Map()).values()).find(t => {
                const a = t.sender === sender && t.recipient === recipient;
                const b = t.sender === recipient && t.recipient === sender;
                return a || b;
            });

            if (!trade) return;

            if (!accepted) {
                io.to(`user:${sender}`).emit('tradeDeclined', { by: recipient, tradeId: trade.tradeId });
                tradeStore.deleteTrade(trade.tradeId);
                return;
            }

            io.to(`user:${sender}`).emit('tradeAccepted', { tradeId: trade.tradeId });
            io.to(`user:${recipient}`).emit('tradeAccepted', { tradeId: trade.tradeId });

            io.to(`user:${sender}`).emit('tradeState', trade);
            io.to(`user:${recipient}`).emit('tradeState', trade);

        });

        socket.on('tradeUpdate', ({ tradeId, username, offer }) => {
            const trade = tradeStore.updateOffer({ tradeId, username, offer });
            if (!trade) return;
            io.to(`trade:${tradeId}`).emit('tradeUpdate', { username, offer });

            io.to(`trade:${tradeId}`).emit('tradeState', trade);
        });

        socket.on('tradeAccept', ({ tradeId, username }) => {
            const trade = tradeStore.setReady({ tradeId, username, ready: true });
            if (!trade) return;
            io.to(`trade:${tradeId}`).emit('tradeAccept', { username });
        });

        socket.on('tradeCancel', ({ tradeId, username }) => {
            const trade = tradeStore.getTrade(tradeId);
            if (!trade) return;
            io.to(`trade:${tradeId}`).emit('tradeCancelled', { by: username });
            tradeStore.deleteTrade(tradeId);
        });

        socket.on('tradeNotifySuccess', ({ tradeId }) => {
            io.to(`trade:${tradeId}`).emit('tradeSuccess');
        });

        socket.on('tradeChat', ({ tradeId, sender, msg }) => {
            io.to(`trade:${tradeId}`).emit('tradeChat', { sender, msg });
        });

        socket.on("chatMessage", async (payload) => {

            if (!payload || typeof payload.content !== "string") {
                return;
            }

            const content = payload.content.trim();
            if (!content) {
                return;
            }

            const earnedTokens = Math.floor(Math.random() * 5) + 1; // 1 - 5 tokens per message

            await User.findOneAndUpdate(
                { id: user.id },
                { $inc: { sent: 1, tokens: earnedTokens } },
                { new: true }
            );

            const savedMessage = await Message.create({
                userId: user.id,
                username: user.username,
                pfp: user.pfp,
                badges: user.badges || [],
                content,
            });


            const broadcastMessage = {
                userId: savedMessage.userId,
                username: savedMessage.username,
                pfp: savedMessage.pfp,
                badges: savedMessage.badges || [],
                content: savedMessage.content,
                createdAt: savedMessage.createdAt,
                _id: savedMessage._id,
            };

            io.emit("chatMessage", broadcastMessage);
        });
    } catch (err) {
        console.error("Socket connection error:", err);
        socket.disconnect(true);
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});