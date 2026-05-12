const express = require("express");
const path = require("path");

const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/home.html"));
});

router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/register.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/login.html"));
});

router.get("/credits", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/credits.html"));
});

router.get("/stats", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/stats.html"));
});

router.get("/market", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/market.html"));
});

router.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/chat.html"));
});

router.get("/ranking", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/ranking.html"));
});

router.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/terms.html"));
});

router.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/settings.html"));
});

router.get("/panel", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/admin/panel.html"));
});

module.exports = router;