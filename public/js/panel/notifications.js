(() => {
  let socket = null;
  let inboxModal = null;
  let inboxListEl = null;

  const getUser = () => {
    try {
      return window.user || null;
    } catch {
      return null;
    }
  };

  const ensureSocket = () => {
    if (socket) return;
    if (typeof io !== "function") return;

    socket = io();

    socket.on("connect", () => {
      const user = getUser();
      if (user && user.username) {
        socket.emit("joinUserRoom", { username: user.username });
      }
    });

    socket.on("inbox:new", (msg) => {
      if (!msg) return;
      showGiftToast(msg);
      if (inboxModal && inboxListEl) {
        loadInboxIntoModal();
      }
    });
  };

  const showGiftToast = (msg) => {
    const toast = document.createElement("div");
    toast.className = "toast inbox-toast";
    toast.style.cssText = `
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 20000;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 14px;
      border-radius: 10px;
      max-width: 420px;
      font-family: Pixelify Sans, sans-serif;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      animation: popIn 0.18s ease;
    `;

    const sender = msg?.username ? ` ${msg.username}` : "";
    const content = msg?.content ? String(msg.content) : "You received a gift.";

    toast.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        ${msg?.pfp ? `<img src="${msg.pfp}" alt="pfp" style="width:34px;height:34px;border-radius:50%"/>` : ""}
        <div style="line-height:1.2">
          <div style="font-weight:700">Inbox${sender}</div>
          <div style="opacity:0.95">${content}</div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  };

  const loadInboxIntoModal = async () => {
    if (!inboxListEl) return;

    inboxListEl.innerHTML = `<div style="padding:12px;color:#fff;opacity:.8">Loading…</div>`;

    try {
      const res = await fetch("/api/inbox", { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load inbox: ${res.status}`);
      const data = await res.json();
      const messages = data?.messages || [];

      inboxListEl.innerHTML = "";

      if (!messages.length) {
        inboxListEl.innerHTML = `
          <div style="color:#fff;opacity:.85;font-size:20px;display:flex;align-items:center;justify-content:center;height:100%">No messages.</div>
        `;
        return;
      }

      for (const msg of messages) {
        const row = document.createElement("div");
        row.style.cssText = `
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 10px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: white;
          font-family: Pixelify Sans, sans-serif;
        `;

        const pfp = msg?.pfp
          ? `<img src="${msg.pfp}" style="width:42px;height:42px;border-radius:50%" />`
          : "";

        row.innerHTML = `
          ${pfp}
          <div style="flex:1">
            <div style="font-weight:800; margin-bottom: 4px;">${msg?.username || "User"}</div>
            <div style="opacity:.95">${msg?.content || ""}</div>
            <div style="margin-top:8px; display:flex; gap:10px; align-items:center">
              <button data-inbox-delete="${msg._id}" style="background:transparent;border:1px solid rgba(255,255,255,0.25);color:#fff;padding:7px 10px;border-radius:10px;cursor:pointer">Delete</button>
            </div>
          </div>
        `;

        inboxListEl.appendChild(row);

        const delBtn = row.querySelector("[data-inbox-delete]");
        if (delBtn) {
          delBtn.addEventListener("click", async () => {
            try {
              const id = delBtn.getAttribute("data-inbox-delete");
              if (!id) return;
              const r = await fetch(`/api/inbox/${id}`, {
                method: "DELETE",
                credentials: "include",
              });
              if (!r.ok) throw new Error(`Failed to delete: ${r.status}`);
              await loadInboxIntoModal();
            } catch (e) {
              console.error(e);
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
      inboxListEl.innerHTML = `<div style="padding:12px;color:#fff;opacity:.85">Failed to load inbox.</div>`;
    }
  };

  const openInboxModal = async () => {
    ensureSocket();

    if (inboxModal) {
      inboxModal.remove();
      inboxModal = null;
      inboxListEl = null;
      return;
    }

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeInOverlay 0.25s ease;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background-color: #6f057a;
      box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0,0,0,0.6);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      width: 555px;
      height: 490px;
      color: white;
      font-family: Pixelify Sans, sans-serif;
      font-size: 18px;
      transform: scale(0.85);
      animation: popIn 0.25s ease forwards;
      position: relative;
      overflow: hidden;
    `;

    const title = document.createElement("div");
    title.innerHTML = '<i class="fa-solid fa-inbox"></i> Inbox';
    title.style.cssText = `
      position: absolute;
      top: 14px;
      left: 16px;
      font-size: 42px !important;
      font-weight: bold;
    `;

    const empty = document.createElement("div");
    empty.textContent = "No messages.";
    empty.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      font-size: 24px;
      text-align: center;
    `;

    box.appendChild(title);
    box.appendChild(empty);
    modal.appendChild(box);
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        inboxModal = null;
        inboxListEl = null;
      }
    });

    inboxModal = modal;

    box.innerHTML = "";
    box.appendChild(title);

    const list = document.createElement("div");
    list.style.cssText = `
      position: absolute;
      inset: 70px 14px 14px 14px;
      overflow: auto;
      padding-right: 6px;
    `;
    inboxListEl = list;
    box.appendChild(list);

    await loadInboxIntoModal();
  };

  const inboxButton = document.getElementById("inboxButton") || document.querySelector("[data-inbox-button]");

  const hook = () => {
    if (inboxButton && inboxButton instanceof HTMLElement) {
      inboxButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await openInboxModal();
      });
    }

    const testSendBtn = document.getElementById("testInboxSend");
    const recipientInput = document.getElementById("testInboxRecipient");
    const testAllCheckbox = document.getElementById("testInboxAll");
    const msgInput = document.getElementById("testInboxMessage");
    const statusEl = document.getElementById("testInboxStatus");

    const setStatus = (t) => {
      if (!statusEl) return;
      statusEl.textContent = t;
    };

    if (testSendBtn && recipientInput && msgInput) {
      testSendBtn.addEventListener("click", async () => {
        try {
          setStatus("Sending...");
          const recipient = recipientInput.value.trim();
          const content = msgInput.value.trim();
          if (!recipient) throw new Error("Recipient username missing");
          if (!content) throw new Error("Message missing");

          const sendAll = !!(testAllCheckbox && testAllCheckbox.checked);

          const r = await fetch("/api/inbox/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              recipientUsername: recipient,
              sendAll,
              content,
            }),
          });

          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`Failed: ${r.status}${txt ? ` - ${txt}` : ""}`);
          }

          setStatus("Notification has been sent out!");
        } catch (err) {
          console.error(err);
          setStatus(String(err?.message || err));
        }
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hook);
  } else {
    hook();
  }
})();

