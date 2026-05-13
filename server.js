require("dotenv").config();

const express = require("express");
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
const chatRoute = require("./backend/routers/api/chat");
const leaderboardRoute = require("./backend/routers/api/leaderboard");
const dailyWheelRoute = require("./backend/routers/api/dailyWheel");
const viewUserRoute = require("./backend/routers/api/viewUser");

const app = express();
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

app.use("/api/user", userRoutes);
app.use("/api/user/daily-wheel", dailyWheelRoute);
app.use("/api/packs", packsRouter);
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/loggedin", loggedinRoute);
app.use("/api/logout", logoutRoute);
app.use("/api/messages", messagesRoute);
app.get("/api/chat/debug", (req, res) => res.json({ ok: true, path: req.path }));
app.use("/api/chat", chatRoute);
app.use("/api/leaderboard", leaderboardRoute);
app.use("/api/viewUser", viewUserRoute);

app.use("/", pages);

app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, "src/views/404.html"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
