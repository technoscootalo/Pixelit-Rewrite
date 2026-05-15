const userGrid = document.getElementById("userGrid");
const userSearch = document.getElementById("userSearch");

let allUsers = [];

async function loadUsers() {
  try {
    const res = await fetch("/api/users");
    const users = await res.json();

    allUsers = users;
    renderUsers(users);

  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

function renderUsers(users) {
  userGrid.innerHTML = "";

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "userCard";

    const status =
      user.banned ? "BANNED" :
      user.muted ? "MUTED" :
      "";

    const statusColor = user.banned
      ? "red"
      : user.muted
      ? "orange"
      : "transparent";

    card.innerHTML = `
      <div class="userLeft">
        <img src="${user.pfp}" alt="${user.username}">
    
        <div class="userInfo">
          <h3>${user.username}</h3>
          <p>${user.role}</p>
        </div>
      </div>

      <div class="userStatus" style="
        color:${statusColor};
        font-weight:bold;
        font-size:12px;
        cursor:pointer;
        user-select:none;
      ">
        ${status}
      </div>
    `;

    card.onclick = () => openUserModal(user);

    const statusEl = card.querySelector(".userStatus");

    statusEl.onclick = (e) => {
      e.stopPropagation();
      if (!status) return;

      openStatusModal(user, status);
    };

    userGrid.appendChild(card);
  });
}

function openStatusModal(user, status) {
  const modal = document.createElement("div");

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  const box = document.createElement("div");

  box.style.cssText = `
    width: 420px;
    background: #5e046e;
    border-radius: 5px;
    padding: 25px;
    text-align: center;
    box-shadow:
      inset 0 -0.365vw #53055c,
      3px 3px 15px rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: white;
  `;

  const reason = user.banned
    ? user.banReason
    : user.muted
    ? user.muteReason
    : "No reason provided";

  const duration = user.banned
    ? user.banDuration
    : user.muted
    ? user.muteDuration
    : 0;

  box.innerHTML = `
    <h2 style="margin:0;">${user.username}</h2>

    <img 
      src="${user.pfp}" 
      style="
        width:90px;
        height:90px;
        border-radius:5px;
        object-fit:cover;
        margin:auto;
        filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
      "
    >

    <div style="
      font-weight:bold;
      color:${user.banned ? 'red' : 'orange'};
      font-size:18px;
    ">
      ${status}
    </div>

    <div style="font-size:14px; opacity:0.9;">
      <p><b>Reason:</b> ${reason}</p>
      <p><b>Duration:</b> ${duration} hours</p>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

userSearch.addEventListener("input", () => {
  const query = userSearch.value.toLowerCase();

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(query)
  );

  renderUsers(filteredUsers);
});

function openUserModal(user) {
  const modal = document.createElement("div");

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  const box = document.createElement("div");

  box.style.cssText = `
    width: 450px;
    padding: 25px;
    border-radius: 5px;
    text-align: center;
    background: #5e046e;
    box-shadow: inset 0 -0.365vw #53055c,
              3px 3px 15px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  box.innerHTML = `
    <img 
      src="${user.pfp}" 
      style="
        width:80px;
        height:80px;
        border-radius:5px;
        object-fit:cover;
        margin:auto;
        filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
      "
    >

    <h2>${user.username}</h2>
    <p>${user.role}</p>

    <input 
      id="reasonInput" 
      placeholder="Reason"
      style="
        height:45px;
        text-align:center;
        font-family:'Pixelify Sans', sans-serif;
        background:transparent;
        border:2px solid #6c5b6f;
        color:white;
        border-radius:5px;
      "
    >

    <input 
      id="durationInput" 
      placeholder="Duration (hours)"
      style="
        height:45px;
        text-align:center;
        font-family:'Pixelify Sans', sans-serif;
        background:transparent;
        border:2px solid #6c5b6f;
        color:white;
        border-radius:5px;
      "
    >

    <div id="buttonRow" style="
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      justify-content:center;
    "></div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  const reasonInput = box.querySelector("#reasonInput");
  const durationInput = box.querySelector("#durationInput");
  const buttonRow = box.querySelector("#buttonRow");

  function createActionButton(text, action) {
    const btn = document.createElement("button");

    btn.innerText = text;

    btn.style.cssText = `
      background:#6f057a;
      color:white;
      border:none;
      padding:10px 18px;
      cursor:pointer;
      border-radius:5px;
      font-family:'Pixelify Sans', sans-serif;
      box-shadow:
        inset 0 -0.3vw #53055c,
        3px 3px 10px rgba(0,0,0,0.5);
    `;

    btn.onclick = action;

    buttonRow.appendChild(btn);
  }

  createActionButton("Mute", async () => {
    await fetch(`/api/users/${user._id}/mute`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason: reasonInput.value,
        duration: durationInput.value
      })
    });

    closeModal();
  });

  createActionButton("Ban", async () => {
    await fetch(`/api/users/${user._id}/ban`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason: reasonInput.value,
        duration: durationInput.value
      })
    });

    closeModal();
  });

  createActionButton("Unmute", async () => {
    await fetch(`/api/users/${user._id}/unmute`, {
      method: "PUT"
    });

    closeModal();
  });

  createActionButton("Unban", async () => {
    await fetch(`/api/users/${user._id}/unban`, {
      method: "PUT"
    });

    closeModal();
  });

  createActionButton("Close", () => {
    closeModal();
  });

  function closeModal() {
    document.body.removeChild(modal);
    loadUsers();
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

loadUsers();