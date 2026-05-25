(() => {
  let socket = null;

  const $ = (sel) => document.querySelector(sel);

  function ensureSocket() {
    if (socket) return socket;

    if (typeof io !== "function") {
      console.error("Socket.IO client (io) is not loaded");
      return null;
    }

    socket = io({ withCredentials: true });

    socket.on("connect", () => {
      console.log("notifications panel socket connected", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("notifications panel socket disconnected");
    });

    socket.on("inbox:new", (msg) => {
      if (!msg || typeof msg.content !== "string") return;
      renderInboxToast(msg);
    });

    return socket;
  }

  function escapeHtml(str) {
    const s = String(str);
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "<")
      .replaceAll(">", ">");
  }

  function renderInboxToast(msg) {
    const container = $("#globalNotificationsList");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "global-notification-row";

    const title = msg.isGlobal ? "Global" : "Inbox";

    row.innerHTML = `
      <div class="global-notification-title">${escapeHtml(title)}</div>
      <div class="global-notification-content">${escapeHtml(msg.content)}</div>
      <div class="global-notification-meta">
        <span>${escapeHtml(msg.username || "")}</span>
        <span class="dot">•</span>
        <span>${new Date(msg.createdAt || Date.now()).toLocaleString()}</span>
      </div>
    `;

    container.prepend(row);

    setTimeout(() => {
      if (row && row.parentNode) row.parentNode.removeChild(row);
    }, 10000);
  }

  function handleSendGlobal(e) {
    const contentEl = $("#globalNotificationContent");
    const sendBtn = $("#sendGlobalNotificationBtn");
    if (!contentEl || !sendBtn) return;

    const content = contentEl.value.trim();
    if (!content) {
      alert("Type a notification message");
      return;
    }

    const s = ensureSocket();
    if (!s) return;

    if (e && typeof e.preventDefault === "function") e.preventDefault();

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
      s.emit("globalNotification:send", { content });
      contentEl.value = "";
    } finally {
      sendBtn.disabled = false;
    }
  }

  function init() {
    ensureSocket();

    const sendBtn = $("#sendGlobalNotificationBtn");
    if (sendBtn) sendBtn.addEventListener("click", handleSendGlobal);

    const form = $("#globalNotificationForm");
    if (form) form.addEventListener("submit", handleSendGlobal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

