let user = null;
const DAILY_WHEEL_COOLDOWN_MS = 1000 * 60 * 60 * 4;

function formatRemaining(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function updateDailyWheelState() {
  const button = document.getElementById("spinButton");
  const messageEl = document.getElementById("dailyWheelMessage");

  if (!button || !messageEl) return;

  if (user && user.lastClaim) {
    const lastClaimDate = new Date(user.lastClaim);
    const nextClaimDate = new Date(lastClaimDate.getTime() + DAILY_WHEEL_COOLDOWN_MS);
    const now = new Date();

    if (nextClaimDate > now) {
      button.style.display = "none";
      messageEl.innerText = `Next wheel in ${formatRemaining(nextClaimDate - now)}`;
      return;
    }
  }

  button.style.display = "inline-flex";
  button.disabled = false;
  messageEl.innerText = "";
}

function showClaimModal(reward) {
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
    min-width: 280px;
    color: white;
    font-family: Pixelify Sans, sans-serif;
    font-size: 18px;
    transform: scale(0.85);
    animation: popIn 0.25s ease forwards;
    position: relative;
    overflow: hidden;
  `;

  box.innerHTML = `
    <h2 style="margin-bottom: 10px; font-size: 1.6rem;">Daily Wheel Reward!</h2>
    <p style="margin: 0 0 12px; font-size: 1rem; opacity: 0.9;">You just received</p>
    <p style="margin: 0; font-size: 2.2rem; font-weight: 700;">${reward.toLocaleString()} tokens</p>
    <p style="margin-top: 10px; opacity: 0.85;">Keep spinning every 4 hours for more!</p>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  modal.addEventListener("click", () => modal.remove());

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes popIn {
      from { transform: scale(0.7); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  modal.appendChild(style);
}

const inboxButton = document.querySelector(".inboxButton");

let inboxModal = null;
let inboxListEl = null;
let socket = null;

function renderInboxMessage(msg) {

  const row = document.createElement("div");
  row.style.cssText = `
    display:flex;
    gap:12px;
    align-items:center;
    padding:12px 10px;
    border-radius:10px;
    background: rgba(0,0,0,0.18);
    margin:10px 0;
    box-shadow: inset 0 -2px rgba(0,0,0,0.15);
  `;

  const img = document.createElement("img");
  img.src = msg.pfp || "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";
  img.alt = `${msg.username || "User"} avatar`;
  img.style.cssText = `width:55px;height:55px;object-fit:cover;filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.87));border-radius:40%;`;

  const content = document.createElement("div");
  content.style.cssText = `flex:1; text-align:left;`;

  const top = document.createElement("div");
  top.style.cssText = `font-size:16px;font-weight:800;opacity:0.95;`;
  top.textContent = msg.username ? msg.username : "System";

  const text = document.createElement("div");
  text.style.cssText = `margin-top:4px;font-size:14px;opacity:0.9;line-height:1.3;`;
  text.textContent = msg.content || "";

  const time = document.createElement("small");
  time.style.cssText = `display:block;margin-top:6px;opacity:0.65;`;
  time.textContent = msg.createdAt ? new Date(msg.createdAt).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";

  content.appendChild(top);
  content.appendChild(text);
  content.appendChild(time);

  row.appendChild(img);
  row.appendChild(content);
  return row;
}


async function fetchInbox() {
  const res = await fetch("/api/inbox", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

function isChatMessage(msg) {
  // With corrected backend inbox, inbox should only contain notifications.
  // Keep this as a safety net; use notification field names.
  const sender = (msg?.senderUsername || msg?.username || "").toString();
  const content = (msg?.content || "").toString();
  const text = `${sender} ${content}`.toLowerCase();
  return text.includes("chat");
}


async function loadInboxIntoModal() {
  if (!inboxModal || !inboxListEl) return;

  inboxListEl.innerHTML = "";

  const messages = await fetchInbox();
  const filtered = Array.isArray(messages) ? messages.filter((m) => !isChatMessage(m)) : [];

  if (!Array.isArray(filtered) || filtered.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No messages";
    empty.style.cssText = `display:flex;justify-content:center;align-items:center;width:100%;height:100%;font-size:18px;opacity:0.9;text-align:center;`;
    inboxListEl.appendChild(empty);
    return;
  }

  filtered.forEach((m) => {
    const row = renderInboxMessage(m);


    const del = document.createElement("button");
    del.textContent = "✕";
    del.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      width: 34px;
      height: 34px;
      cursor: pointer;
      font-size: 26px;
      font-weight: 900;
    `;
    del.title = "Delete notification";
    del.onclick = async () => {
      try {
        const id = m._id || m.id;
        if (id) {
          await fetch(`/api/inbox/${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
          });
        }
      } catch (e) {
        console.error("failed to delete inbox item:", e);
      }
      row.remove();
    };

    row.appendChild(del);
    inboxListEl.appendChild(row);
  });
}

function showGiftToast(msg) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 100000;
    background: rgba(111, 5, 122, 0.98);
    border-radius: 0px;
    box-shadow: inset 0 -0.365vw #61056b, 0 10px 30px rgba(0,0,0,0.45);
    padding: 14px 16px;
    width: 360px;
    color: white;
    font-family: Pixelify Sans, sans-serif;
    transform: translateY(10px);
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
  `;

  const title = document.createElement("div");
  title.style.cssText = `font-weight:900; font-size:16px; opacity:0.95;`;
  title.textContent = msg.username ? `${msg.username}` : "Gift";

  const body = document.createElement("div");
  body.style.cssText = `margin-top:6px; font-size:14px; opacity:0.9; line-height:1.3;`;
  body.textContent = msg.content || "";

  toast.appendChild(title);
  toast.appendChild(body);
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0px)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

inboxButton && inboxButton.addEventListener("click", async () => {
  if (!socket && typeof io === "function") {
    try {
      socket = io();
      socket.on("connect", () => {
        if (user && user.username) socket.emit("joinUserRoom", { username: user.username });
      });

      socket.on("inbox:new", (msg) => {
        if (!msg) return;
        if (isChatMessage(msg)) return;
        showGiftToast(msg);
        if (inboxModal && inboxListEl) {
          loadInboxIntoModal();
        }
      });
    } catch (e) {
      console.error("inbox socket init failed:", e);
    }
  }

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
  title.innerHTML = '<i class="fa-solid fa-inbox"></i> Inbox'
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

  const boxStyle = box.style;
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

  document.body.appendChild(modal);
  inboxModal = null;
  inboxListEl = null;
});

async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      window.location.href = "/login";
      return;
    }

    user = await res.json();

    user.tokens = user.tokens || 0;
    user.opened = user.opened || 0;
    user.sent = user.sent || 0;

    const pfp = document.getElementById("pfp");
    const banner = document.getElementById("banner");
    const usernameEl = document.getElementById("username");
    const roleEl = document.getElementById("role");

    const roleColors = {
      Owner: "#020202",
      Veteran: "#969a5c",
      Verified: "#5ab65b",
      Plus: "#5657d3",
      Tester: "#80a1d3",
      Helper: "#4b69c3",
      Moderator: "#ab53c4",
      Admin: "#dc6dc1",
      "Community Manager": "#69c95d",
      Developer: "#6a76c7",
      Artist: "#ca964c",
      Player: "#FFFFFF",
    };

    if (pfp) pfp.src = user.pfp || "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";
    if (banner) banner.src = user.banner || "https://izumiihd.github.io/pixelitcdn/assets/img/banner/pixelitBanner.png";

    if (usernameEl) {
      usernameEl.innerText = user.username;
      const color = roleColors[user.role];
      if (color) usernameEl.style.color = color;
    }
    if (roleEl) {
      roleEl.innerText = user.role || "Player";
      const color = roleColors[user.role];
      if (color) roleEl.style.color = color;
    }


    const tokensEl = document.getElementById("tokens");
    const openedEl = document.getElementById("opened");
    const messagesEl = document.getElementById("messages");

    if (tokensEl) tokensEl.innerText = user.tokens.toLocaleString();
    if (openedEl) openedEl.innerText = user.opened.toLocaleString();
    if (messagesEl) messagesEl.innerText = user.sent.toLocaleString();

    checkPanelAccess();
    updateDailyWheelState();
  } catch (err) {
    console.error("Failed to load user data:", err);
  }
}

async function claimDailyWheel() {
    const button = document.getElementById("spinButton");
    const messageEl = document.getElementById("dailyWheelMessage");
    const tokensEl = document.getElementById("tokens");

    if (!button || !messageEl) return;

    button.disabled = true;

    messageEl.innerText = "Claiming your reward...";

    try {

        const response = await fetch("/api/user/daily-wheel", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {

            button.disabled = false;

            if (data.nextClaim) {

                const remaining =
                    new Date(data.nextClaim) - new Date();

                messageEl.innerText =
                    `Next wheel in ${formatRemaining(remaining)}`;

                button.style.display = "none";

            } else {

                messageEl.innerText =
                    data.error || "Unable to claim reward.";

            }

            return;
        }

        user.tokens = data.tokens;
        user.lastClaim = new Date().toISOString();

        if (tokensEl) {
            tokensEl.innerText =
                user.tokens.toLocaleString();
        }

        if (typeof showClaimModal === "function") {
            showClaimModal(data.reward);
        }

        messageEl.innerText =
            `You won ${data.reward.toLocaleString()} tokens!`;

        if (typeof updateDailyWheelState === "function") {
            updateDailyWheelState();
        }

    } catch (err) {

        console.error(
            "Daily wheel claim failed:",
            err
        );

        button.disabled = false;

        messageEl.innerText =
            "Claim failed. Please try again later.";
    }
}

const spinButton = document.getElementById("spinButton");
if (spinButton) {
  spinButton.addEventListener("click", claimDailyWheel);
}

function createElement(tag, props = {}, styles = {}) {
  const el = document.createElement(tag);
  Object.assign(el, props);
  Object.assign(el.style, styles);
  return el;
}

function openViewUserPopup() {
  const modal = createElement('div', {}, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '10000',
  });

  const modalContent = createElement('div', {}, {
    backgroundColor: '#6f057a',
    boxShadow: 'inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0, 0, 0, 0.6)',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '26px',
    width: '420px',
    color: 'white',
    fontFamily: 'Pixelify Sans, sans-serif',
  });

  const title = createElement('h2');
  title.textContent = 'View Player';
  modalContent.appendChild(title);

  const input = createElement('input', {
    type: 'text',
    placeholder: 'Username',
    id: 'viewUsernameInput',
  }, {
    width: '60%',
    height: '50px',
    backgroundColor: 'transparent',
    padding: '10px 14px',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: '10px',
    border: '3px solid white',
    color: 'white',
    fontSize: '24px',
    fontFamily: 'Pixelify Sans, sans-serif',
    outline: 'none',
    marginBottom: '10px',
    boxSizing: 'border-box'
  });
  modalContent.appendChild(input);

  const errorEl = createElement('div', { id: 'viewUserError' }, {
    color: 'red',
    fontSize: '14px',
    marginTop: '5px',
    display: 'none'
  });
  modalContent.appendChild(errorEl);

  const buttonRow = createElement('div', {}, {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '10px',
  });

  const viewButton = createElement('button', { 
    type: 'button',
    className: 'viewUser-modal-btn viewUser-modal-btn-primary'
  });
  viewButton.textContent = 'Search';

  const cancelButton = createElement('button', { 
    type: 'button',
    className: 'viewUser-modal-btn viewUser-modal-btn-secondary'
  });
  cancelButton.textContent = 'Cancel';

  const restoreMyProfile = () => {
    const orig = window.__profileViewOriginal;
    if (!orig) return;

    const reportBtn = document.querySelector('.report-user-btn');
    if (reportBtn) reportBtn.remove();

    const elements = {
      pfp: document.getElementById('pfp'),
      banner: document.getElementById('banner'),
      username: document.getElementById('username'),
      role: document.getElementById('role'),
      tokens: document.getElementById('tokens'),
      opened: document.getElementById('opened'),
      messages: document.getElementById('messages'),
      spinButton: document.getElementById('spinButton')
    };

    if (elements.pfp) elements.pfp.src = orig.pfp || 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png';
    if (elements.banner) elements.banner.src = orig.banner || 'https://izumiihd.github.io/pixelitcdn/assets/img/banner/pixelitBanner.png';
    if (elements.username) elements.username.innerText = orig.username;
    if (elements.role) elements.role.innerText = orig.role || 'Player';
    if (elements.tokens) elements.tokens.innerText = (orig.tokens ?? 0).toLocaleString();
    if (elements.opened) elements.opened.innerText = (orig.opened ?? 0).toLocaleString();
    if (elements.messages) elements.messages.innerText = (orig.sent ?? 0).toLocaleString();

    if (elements.spinButton) {
      elements.spinButton.style.display = 'inline-flex';
      elements.spinButton.disabled = false;
    }

    window.history.pushState({}, '', '/stats');

    window.__profileViewMode = 'my';
    if (typeof loadUser === 'function') loadUser();

    const btn = document.querySelector('.viewUser');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> View Stats';
      btn.onclick = openViewUserPopup;
    }
  };

  viewButton.onclick = async () => {
    const searchUser = input.value.trim();
    errorEl.style.display = 'none';

    if (!searchUser) {
      errorEl.textContent = 'Please enter a username.';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const res = await fetch('/api/viewUser/getUserStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: searchUser }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        errorEl.textContent = data.message || 'User not found.';
        errorEl.style.display = 'block';
        return;
      }

      const other = data.user;
      if (!window.__profileViewOriginal && typeof user !== 'undefined') {
        window.__profileViewOriginal = { ...user };
      }

      const url = new URL(window.location.href);
      url.searchParams.set('name', other.username);
      window.history.pushState({}, '', url);
      window.__profileViewMode = 'other';

      const ui = {
        pfp: document.getElementById('pfp'),
        banner: document.getElementById('banner'),
        username: document.getElementById('username'),
        role: document.getElementById('role'),
        tokens: document.getElementById('tokens'),
        opened: document.getElementById('opened'),
        messages: document.getElementById('messages'),
        spinButton: document.getElementById('spinButton'),
        dailyWheelMessage: document.getElementById('dailyWheelMessage'),
        viewUserBtn: document.querySelector('.viewUser')
      };

      if (ui.pfp) ui.pfp.src = other.pfp || 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png';
      if (ui.banner) ui.banner.src = other.banner || 'https://izumiihd.github.io/pixelitcdn/assets/img/banner/pixelitBanner.png';
      const roleColors = {
        Owner: "#020202",
        Veteran: "#969a5c",
        Verified: "#5ab65b",
        Plus: "#5657d3",
        Tester: "#80a1d3",
        Helper: "#4b69c3",
        Moderator: "#ab53c4",
        Admin: "#dc6dc1",
        "Community Manager": "#69c95d",
        Developer: "#6a76c7",
        Artist: "#ca964c",
        Player: "#FFFFFF"
      };

      if (ui.username) {
        ui.username.innerText = other.username;
        const color = roleColors[other.role];
        if (color) ui.username.style.color = color;
      }
      if (ui.role) {
        ui.role.innerText = other.role || "Player";
        const color = roleColors[other.role];
        if (color) ui.role.style.color = color;
      }

      if (ui.tokens) ui.tokens.innerText = (other.tokens ?? 0).toLocaleString();
      if (ui.opened) ui.opened.innerText = (other.opened ?? 0).toLocaleString();
      if (ui.messages) ui.messages.innerText = (other.stats?.sent ?? 0).toLocaleString();

      if (ui.spinButton) {
        ui.spinButton.style.display = 'none';
        ui.spinButton.disabled = true;
      }

      if (ui.viewUserBtn) {
        ui.viewUserBtn.innerHTML = '<i class="fa-solid fa-reply"></i> Back to my profile';
        ui.viewUserBtn.onclick = restoreMyProfile;

        const existingReport = document.querySelector('.report-user-btn');
        if (existingReport) existingReport.remove();

        const reportBtn = document.createElement('button');
        reportBtn.className = 'reportUser report-user-btn';
        reportBtn.innerHTML = '<i class="fa-solid fa-flag"></i> Report';

        reportBtn.onclick = () => {
          const modal = createElement('div', {}, {
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000',
          });

          const box = createElement('div', {}, {
            backgroundColor: '#6f057a',
            boxShadow: 'inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0, 0, 0, 0.6)',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '26px',
            width: '420px',
            color: 'white',
            fontFamily: 'Pixelify Sans, sans-serif',
          });

          const title = createElement('div', {}, {
            fontSize: '26px',
            marginBottom: '12px',
            fontWeight: 'bold',
          });
          title.textContent = `Why are you reporting ${other.username}?`;

          const input = createElement('input', {
            type: 'text',
            placeholder: 'Reason for reporting...',
          }, {
            width: '60%',
            height: '50px',
            marginBottom: '10px',
            fontFamily: 'Pixelify Sans, sans-serif',
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '3px solid #5e046e',
            borderRadius: '4px',
            boxSizing: 'border-box',
            backgroundColor: 'transparent',
            color: 'white',
            marginRight: '5px',
            outline: 'none',
          });

          const errorEl = createElement('div', {}, {
            color: 'red',
            fontSize: '14px',
            marginBottom: '10px',
            display: 'none',
          });

          const successEl = createElement('div', {}, {
            color: '#5CFF77',
            fontSize: '16px',
            marginBottom: '10px',
            display: 'none',
          });

          const sendBtn = createElement('button', { type: 'button' }, {
            backgroundColor: '#ff4d4d',
            boxShadow: 'inset 0 -0.365vw #b30000, 3px 3px 15px rgba(0, 0, 0, 0.6)',
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Pixelify Sans, sans-serif',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
          });
          sendBtn.textContent = 'Send report';

          const btnRow = createElement('div', {}, {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '8px',
          });
          btnRow.appendChild(sendBtn);

          box.appendChild(title);
          box.appendChild(input);
          box.appendChild(errorEl);
          box.appendChild(successEl);
          box.appendChild(btnRow);

          modal.appendChild(box);
          document.body.appendChild(modal);

          const close = () => {
            document.body.onclick = null;
            modal.remove();
          };

          modal.addEventListener('click', (e) => {
            if (e.target === modal || e.currentTarget === modal) close();
          });

          document.body.addEventListener('click', (e) => {
            if (modal.contains(e.target)) return;
            close();
          }, { once: true });

          input.focus();

          const submit = async () => {
            const reason = (input.value || '').trim();
            errorEl.style.display = 'none';

            if (!reason) {
              errorEl.textContent = 'Reason is required.';
              errorEl.style.display = 'block';
              return;
            }

            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';

            try {
              const r = await fetch('/api/reportUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: other.username, reason }),
              });

              const d = await r.json();

              successEl.textContent = d.message || 'Report sent.';
              successEl.style.display = 'block';
              setTimeout(() => close(), 500);
            } catch (err) {
              console.error(err);
              errorEl.textContent = 'Failed to send report.';
              errorEl.style.display = 'block';
              sendBtn.disabled = false;
              sendBtn.textContent = 'Send report';
            }
          };

          sendBtn.onclick = submit;
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
          });
        };

        ui.viewUserBtn.parentNode.insertBefore(reportBtn, ui.viewUserBtn.nextSibling);
      }

      modal.remove();
    } catch (error) {
      console.error(error);
      alert('Error loading profile.');
    }
  };

  cancelButton.onclick = () => modal.remove();

  buttonRow.appendChild(viewButton);
  buttonRow.appendChild(cancelButton);
  modalContent.appendChild(buttonRow);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  input.focus();
}

const viewUserButton = document.querySelector('.viewUser');

if (viewUserButton) {
  viewUserButton.onclick = openViewUserPopup;
}

loadUser();