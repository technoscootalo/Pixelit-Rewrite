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

router.get("/pixels", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/pixels.html"));
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
    res.sendFile(path.join(__dirname, "../../src/views/panel/panel.html"));
});

router.get("/users", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/users.html"));
});

router.get("/developer", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/developer.html"));
});

router.get("/developer", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/developer.html"));
});

router.get("/pixelseditor", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/pixelseditor.html"));
});

router.get("/packeditor", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/packeditor.html"));
});

router.get("/badgeeditor", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/badgeeditor.html"));
});

router.get("/bannereditor", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/bannereditor.html"));
});

router.get("/reports", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/reports.html"));
});

module.exports = router;