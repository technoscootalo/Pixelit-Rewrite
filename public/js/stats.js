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

inboxButton.addEventListener("click", () => {
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
  title.textContent = "Inbox";
  title.style.cssText = `
    position: absolute;
    top: 14px;
    left: 16px;
    font-size: 32px;
    font-weight: bold;
    opacity: 0.8;
  `;

  const empty = document.createElement("div");
  empty.textContent = "No messages";
  empty.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    font-size: 18px;
    opacity: 0.9;
    text-align: center;
  `;

  box.appendChild(title);
  box.appendChild(empty);
  modal.appendChild(box);
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
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
  title.textContent = 'View User';
  modalContent.appendChild(title);

  const input = createElement('input', {
    type: 'text',
    placeholder: 'Username',
    id: 'viewUsernameInput',
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

  const viewButton = createElement('button', { type: 'button' }, {
    backgroundColor: 'green',
    boxShadow: 'inset 0 -0.365vw #006400, 3px 3px 15px rgba(0, 0, 0, 0.6)',
    fontFamily: 'Pixelify Sans, sans-serif',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  });
  viewButton.textContent = 'View Profile';

  const cancelButton = createElement('button', { type: 'button' }, {
    backgroundColor: 'red',
    boxShadow: 'inset 0 -0.365vw #b30000, 3px 3px 15px rgba(0, 0, 0, 0.6)',
    fontFamily: 'Pixelify Sans, sans-serif',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
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
