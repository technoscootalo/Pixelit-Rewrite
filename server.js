require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const path = require("path");
const session = require("express-session");

const connectDB = require("./backend/utils/db");

// routers
const pages = require("./backend/routers/pages");
const registerRoute = require("./backend/routers/auth/register");
const loginRoute = require("./backend/routers/auth/login");
const loggedinRoute = require("./backend/routers/auth/loggedin");
const logoutRoute = require("./backend/routers/auth/logout");
const userRoutes = require("./backend/routers/user");
const packsRouter = require("./backend/routers/api/packs");
const messagesRoute = require("./backend/routers/api/messages");
const leaderboardRoute = require("./backend/routers/api/leaderboard");
const dailyWheelRoute = require("./backend/routers/api/dailyWheel");
const viewUserRoute = require("./backend/routers/api/viewUser");
const blookRoutes = require("./backend/routers/api/blooks");
const changeUsernameRoute = require("./backend/routers/api/changeUsername");
const badgeRoutes = require("./backend/routers/api/badges");
const bannerRoutes = require("./backend/routers/api/banners");

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: "pixelit.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

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
app.use("/api/leaderboard", leaderboardRoute);
app.use("/api/viewUser", viewUserRoute);
app.use("/api/changeUsername", changeUsernameRoute);
app.use("/api/badges", badgeRoutes);
app.use("/api/banners", bannerRoutes);

app.use("/", pages);

app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "src/views/404.html"));
});

httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
