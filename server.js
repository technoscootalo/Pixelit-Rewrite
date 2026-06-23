require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { Server: SocketIOServer } = require("socket.io");

const connectDB = require("./backend/utils/db");
const { setupChat } = require("./backend/socket/chat");

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY environment variable is missing. Payment functionality will be disabled.");
} else {
    console.log("Stripe initialization payload validated successfully.");
}

const PORT = process.env.PORT || 3000;
const allowedCorsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

// ==========================================
// ROUTE IMPORTS (Alphabetical)
// ==========================================

const articlesRoute = require("./backend/routers/api/articles");
const badgeRoutes = require("./backend/routers/api/badges");
const bannerRoutes = require("./backend/routers/api/banners");
const bazaarRouter = require("./backend/routers/api/bazaar");
const bazaarPacksRouter = require("./backend/routers/api/bazaarPacks");
const blookRoutes = require("./backend/routers/api/blooks");
const blooksRoutes = require("./backend/routers/users/blooks");
const boostersRoute = require("./backend/routers/api/boosters");
const boostersActivateRoute = require("./backend/routers/api/boostersActivate");
const boostersActiveMultiplierRoute = require("./backend/routers/api/getActiveBoosters");
const changeBannerRoute = require("./backend/routers/api/changeBanner");
const changePasswordRouter = require("./backend/routers/api/changePassword");
const changePfpRoute = require("./backend/routers/api/changePfp");
const changeUsernameRoute = require("./backend/routers/api/changeUsername");
const dailyWheelRoute = require("./backend/routers/api/dailyWheel");
const giftBlookRoute = require("./backend/routers/users/giftBlook");
const inboxRoute = require("./backend/routers/api/inbox");
const inventoryRoute = require("./backend/routers/api/inventory");
const leaderboardRoute = require("./backend/routers/api/leaderboard");
const listBlookRouter = require("./backend/routers/users/listBlook");
const loggedinRoute = require("./backend/routers/auth/loggedin");
const loginRoute = require("./backend/routers/auth/login");
const logoutRoute = require("./backend/routers/auth/logout");
const marketActiveBoostersRoute = require("./backend/routers/api/marketActiveBoosters");
const marketBoostersBuyRoute = require("./backend/routers/api/marketBoosterBuy");
const messagesRoute = require("./backend/routers/api/messages");
const moderationReportsRoute = require("./backend/routers/api/moderationReports");
const packRouter = require("./backend/routers/api/pack");
const packsRouter = require("./backend/routers/api/packs");
const pages = require("./backend/routers/pages");
const registerRoute = require("./backend/routers/auth/register");
const reportUserRoute = require("./backend/routers/api/reportUser");
const sellBlookRoute = require("./backend/routers/users/sellBlook");
const sendTokensRouter = require("./backend/routers/api/sendTokens");
const stripeHandlers = require("./backend/routers/api/stripe");
const userBlooksRoutes = require("./backend/routers/api/userBlooks");
const userRoutes = require("./backend/routers/user");
const usersRoutes = require("./backend/routers/api/users");
const viewUserRoute = require("./backend/routers/api/viewUser");

const app = express();
const httpServer = http.createServer(app);

connectDB();

const sessionMiddleware = session({
    name: "pixelit.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if running production https
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
});

app.post("/api/stripe/webhook", bodyParser.raw({ type: "application/json" }), stripeHandlers.webhookHandler);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// ENDPOINT ROUTING
// ==========================================

app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/loggedin", loggedinRoute);
app.use("/api", logoutRoute);
app.use("/api/user", userRoutes);
app.use("/api/user", changePfpRoute);
app.use("/api/users", usersRoutes);
app.use("/api/viewUser", viewUserRoute);
app.use("/api/changePassword", changePasswordRouter);
app.use("/api/changeUsername", changeUsernameRoute);
app.use("/api", changeBannerRoute);
app.use("/api/blooks", blookRoutes);
app.use("/api/users", blooksRoutes);
app.use("/api/userBlooks", userBlooksRoutes);
app.use("/api/inventory", inventoryRoute);
app.use("/api/badges", badgeRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/packs", packsRouter);
app.use("/api/packs", packRouter);
app.use("/api/bazaar/packs", bazaarPacksRouter);
app.use("/api/bazaar", bazaarRouter);
app.use("/api/sendTokens", sendTokensRouter);
app.use("/api/users/sell-blook", sellBlookRoute);
app.use("/api/users/gift-blook", giftBlookRoute);
app.use("/api/users", listBlookRouter);
app.use("/api/boosters", boostersRoute);
app.use("/api/boosters", boostersActiveMultiplierRoute);
app.use("/api/boosters", boostersActivateRoute);
app.use("/api/market/boosters", marketBoostersBuyRoute);
app.use("/api/market/boosters", marketActiveBoostersRoute);
app.use("/api/user/daily-wheel", dailyWheelRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/inbox", inboxRoute);
app.use("/api/leaderboard", leaderboardRoute);
app.use("/api/articles", articlesRoute);
app.use("/api/reportUser", reportUserRoute);
app.use("/api/moderationReports", moderationReportsRoute);
app.use("/api/stripe", stripeHandlers.router);
app.use("/", pages);

app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/src/views/404.html"));
});

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
setupChat(io, onlineUsers);

setTimeout(() => {
    httpServer.listen(PORT, () => {
        console.log(`Pixelit server successfully initialized and listening on port ${PORT}.`);
    });
}, 2000);