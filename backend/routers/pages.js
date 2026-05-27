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

const { requireLoggedIn, requireNotBanned } = require("../middleware/sessionUser");

router.get("/stats", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/stats.html"));
});

router.get("/market", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/market.html"));
});

router.get("/pixels", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/pixels.html"));
});

router.get("/chat", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/chat.html"));
});

router.get("/ranking", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/ranking.html"));
});

router.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/terms.html"));
});

router.get("/settings", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/settings.html"));
});

router.get("/inventory", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/inventory.html"));
});

/* 
router.get("/store", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/store.html"));
});
*/

router.get("/credits", requireLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/credits.html"));
});

router.get("/trade", requireLoggedIn, requireNotBanned, (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/trade.html"));
});

const { requirePanelAccess, requireDeveloperAccess } = require("../middleware/panelAuth");

router.get("/panel", requirePanelAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/panel.html"));
});

router.get("/users", requirePanelAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/users.html"));
});

router.get("/developer", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/developer.html"));
});


router.get("/pixelseditor", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/pixelseditor.html"));
});

router.get("/packeditor", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/packeditor.html"));
});

router.get("/badgeeditor", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/badgeeditor.html"));
});

router.get("/bannereditor", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/bannereditor.html"));
});


router.get("/newseditor", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/newseditor.html"));
});

router.get("/notifications", requireDeveloperAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/notifications.html"));
});

router.get("/reports", requirePanelAccess(), (req, res) => {
    res.sendFile(path.join(__dirname, "../../src/views/panel/reports.html"));
});


module.exports = router;