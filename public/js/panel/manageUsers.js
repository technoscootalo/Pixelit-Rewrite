const userGrid = document.getElementById("userGrid");
const userSearch = document.getElementById("userSearch");

let allUsers = [];
let allBadges = [];

async function loadUsers() {
  try {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error(`Failed to load users: ${res.status}`);
    const users = await res.json();
    allUsers = users;
    renderUsers(users);
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

async function loadBadges() {
  const res = await fetch("/api/badges");
  if (!res.ok) throw new Error(`Failed to load badges: ${res.status}`);
  allBadges = await res.json();
}

function renderUsers(users) {
  userGrid.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "userCard";

    card.innerHTML = `
      <div class="userLeft">
        <img src="${user.pfp}" alt="${user.username}">
        <div class="userInfo">
          <h3>${user.username}</h3>
          <p>${user.role}</p>
        </div>
      </div>

      <button class="userManageBtn" type="button" data-userid="${user._id}">
        Manage
      </button>
    `;

    card.querySelector(".userManageBtn").onclick = (e) => {
      e.stopPropagation();
      openUserModal(user);
    };

    userGrid.appendChild(card);
  });
}

function badgeToUserBadgeShape(badge) {
  return {
    badgeId: String(badge._id ?? ""),
    _id: badge._id,
    name: badge.name,
    image: badge.image,
  };
}

function closeModal(modal) {
  if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
  loadUsers();
}

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
    padding: 18px;
    overflow: auto;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    width: 860px;
    max-width: 100%;
    padding: 22px;
    border-radius: 10px;
    text-align: center;
    background: #5e046e;
    box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: white;
  `;

  const badgesHtml = (user.badges || [])
    .map(
      (b) => `
        <div class="userBadge" style="display:flex; align-items:center; gap:10px; justify-content:center; padding:8px 10px; border-radius:8px; background: rgba(0,0,0,0.18);">
          <img src="${b.image}" alt="${b.name}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;" />
          <span style="font-weight:700; font-size:14px;">${b.name}</span>
          <button
            type="button"
            class="userBadgeRemoveBtn"
            data-badgeid="${String(b.badgeId ?? b._id ?? "")}" 
            style="margin-left:4px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); color:white; border-radius:8px; padding:6px 10px; cursor:pointer; font-family:'Pixelify Sans', sans-serif; font-weight:700;"
            title="Remove badge"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `
    )
    .join("");

  box.innerHTML = `
    <div style="display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:wrap;">
      <img 
        src="${user.pfp}" 
        style="width:72px; height:72px; border-radius:10px; object-fit:cover; filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));"
      />
      <div>
        <h2 style="margin:0;">${user.username}</h2>
        <p style="margin:6px 0 0; opacity:0.9;">Current role: <b id="currentRoleLabel">${user.role}</b></p>
      </div>
    </div>

    <div class="roleSection" style="display:flex; gap:12px; justify-content:center; align-items:center; flex-wrap:wrap;">
      <div style="min-width: 300px; flex: 1;">
        <label style="display:block; font-weight:700; margin-bottom:8px;">Role</label>
        <input
          id="roleInput"
          value="${user.role || "Player"}"
          style="
            width: 100%;     
            padding: 10px 14px;
            font-weight: bold;
            text-align: center;
            border-radius: 10px;
            border: 3px solid white;
            background: #5e046e;
            color: white;
            font-size: 24px;
            font-family: Pixelify Sans;
            outline: none;"
          "
        />
      </div>

      <div style="display:flex; gap:12px;">
        <button id="saveRoleBtn" type="button" style="
          flex: 1;
          height: 52px;
          border: none;
          border-radius: 10px;
          font-family: 'Pixelify Sans', sans-serif;
          font-weight: 800;
          cursor: pointer;
          background: #3aab3a;
          color: white;
          box-shadow: inset 0 -0.265vw rgba(0, 0, 0, 0.25), 3px 3px 14px rgba(0,0,0,0.5);
        " onmouseover="this.style.filter='brightness(1.08)'" onmouseout="this.style.filter='brightness(1)'">
          Save Role
        </button>

        <button id="closeBtn" type="button" style="
          flex: 1;
          height: 52px;
          border: none;
          border-radius: 10px;
          font-family: 'Pixelify Sans', sans-serif;
          font-weight: 800;
          cursor: pointer;
          background: #5e046e;
          color: white;
          box-shadow: inset 0 -0.265vw #53055c, 3px 3px 14px rgba(0,0,0,0.5);
          border: 2px solid rgba(255, 255, 255, 0.85);
        " onmouseover="this.style.filter='brightness(1.08)'" onmouseout="this.style.filter='brightness(1)'">
          Close
        </button>
      </div>
    </div>

    <div class="badgesSection" style="display:flex; gap:18px; flex-wrap:wrap; justify-content:space-between;">
      <div style="flex: 1; min-width: 320px;">
        <h3 style="margin:0 0 12px;">Badges</h3>
        <div id="currentBadges" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          ${badgesHtml || "<div style='opacity:0.8;'>No badges</div>"}
        </div>
      </div>

      <div style="flex: 1.2; min-width: 320px;">
        <h3 style="margin:0 0 12px;">Add Badge</h3>

        <div style="display:flex; gap:10px; margin-bottom:10px; flex-wrap:wrap; justify-content:center;">
          <input
            id="badgeSearchInput"
            type="text"
            placeholder="Search badges..."
            style="  
              width: 100%;     
              padding: 10px 14px;
              font-weight: bold;
              text-align: center;
              border-radius: 10px;
              border: 3px solid white;
              background: #5e046e;
              color: white;
              font-size: 24px;
              font-family: Pixelify Sans;
              outline: none;"
            "
          />
        </div>

        <div id="badgeGrid" style="max-height: 260px; overflow:auto; display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:10px; padding:6px; border-radius:10px; background: rgba(0,0,0,0.12);"></div>

        <button id="addBadgeBtn" type="button" style="
            margin-top: 10px;
            height: 52px;
            border: none;
            border-radius: 10px;
            font-family: 'Pixelify Sans', sans-serif;
            font-weight: 800;
            cursor: pointer;
            background: #5e046e;
            color: white;
            box-shadow: inset 0 -0.265vw #53055c, 3px 3px 14px rgba(0,0,0,0.5);
            border: 2px solid rgba(255, 255, 255, 0.85);
          " 
          onmouseover="this.style.filter='brightness(1.08)'" 
          onmouseout="this.style.filter='brightness(1)'">
            Add Selected Badge
        </button>

        <div id="selectedBadgeLabel" style="margin-top:8px; opacity:0.9; font-size:14px;">Selected: None</div>
      </div>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  const roleInput = box.querySelector("#roleInput");
  const saveRoleBtn = box.querySelector("#saveRoleBtn");
  const closeBtn = box.querySelector("#closeBtn");
  const currentBadgesEl = box.querySelector("#currentBadges");

  currentBadgesEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".userBadgeRemoveBtn");
    if (!btn) return;

    const badgeId = String(btn.getAttribute("data-badgeid") || "");
    if (!badgeId) return;

    const res = await fetch(`/api/users/${user._id}/badges/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId }),
    });

    if (!res.ok) {
      console.error("Failed to remove badge", await res.text());
      return;
    }

    user.badges = Array.isArray(user.badges) ? user.badges : [];
    user.badges = user.badges.filter(
      (ub) => String(ub.badgeId ?? ub._id ?? "") !== badgeId
    );

    currentBadgesEl.innerHTML = (user.badges || [])
      .map(
        (b) => `
          <div class="userBadge" style="display:flex; align-items:center; gap:10px; justify-content:center; padding:8px 10px; border-radius:8px; background: rgba(0,0,0,0.18);">
            <img src="${b.image}" alt="${b.name}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;" />
            <span style="font-weight:700; font-size:14px;">${b.name}</span>
            <button
              type="button"
              class="userBadgeRemoveBtn"
              data-badgeid="${String(b.badgeId ?? b._id ?? "")}" 
              style="margin-left:4px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); color:white; border-radius:8px; padding:6px 10px; cursor:pointer; font-family:'Pixelify Sans', sans-serif; font-weight:700;"
              title="Remove badge"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `
      )
      .join("");
  });
  const badgeSearchInput = box.querySelector("#badgeSearchInput");
  const badgeGrid = box.querySelector("#badgeGrid");
  const addBadgeBtn = box.querySelector("#addBadgeBtn");
  const selectedBadgeLabel = box.querySelector("#selectedBadgeLabel");

  let selectedBadge = null;

  function renderBadgeGrid(filterText = "") {
    const q = String(filterText).toLowerCase();
    const filtered = (allBadges || []).filter((b) => {
      const name = (b.name || "").toLowerCase();
      const image = (b.image || "").toLowerCase();
      return name.includes(q) || image.includes(q);
    });

    badgeGrid.innerHTML = "";

    filtered.forEach((badge) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.cssText = `
        background: rgba(111,5,122,0.25);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
        transition: 0.12s ease;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:6px;
        color:white;
      `;

      const alreadyHas = (user.badges || []).some((ub) => String(ub.badgeId ?? ub._id ?? "") === String(badge._id));
      btn.style.opacity = alreadyHas ? "0.5" : "1";
      btn.disabled = alreadyHas;

      btn.innerHTML = `
        <img src="${badge.image}" alt="${badge.name}" style="width:34px; height:34px; border-radius:8px; object-fit:cover;" />
        <div style="font-size:12px; font-weight:700; text-align:center; line-height:1.1; max-height: 2.2em; overflow:hidden;font-family: 'Pixelify Sans', sans-serif;">${badge.name}</div>
      `;

      btn.onclick = () => {
        selectedBadge = badge;
        selectedBadgeLabel.innerText = `Selected: ${badge.name}`;

        Array.from(badgeGrid.querySelectorAll("button")).forEach((el) => {
          el.style.outline = "none";
        });
        btn.style.outline = "2px solid #ffffff";
      };

      badgeGrid.appendChild(btn);
    });
  }

  badgeSearchInput.addEventListener("input", () => {
    renderBadgeGrid(badgeSearchInput.value);
  });

  saveRoleBtn.onclick = async () => {
    const role = String(roleInput.value || "").trim();
    if (!role) return;

    const res = await fetch(`/api/users/${user._id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      console.error("Failed to save role", await res.text());
      return;
    }

    const data = await res.json().catch(() => null);
    const newRole = data?.role ?? role;
    box.querySelector("#currentRoleLabel").innerText = newRole;
    user.role = newRole;

    renderBadgeGrid(badgeSearchInput.value);
  };

  closeBtn.onclick = () => closeModal(modal);

  addBadgeBtn.onclick = async () => {
    if (!selectedBadge) return;

    const badgeId = String(selectedBadge._id);

    const res = await fetch(`/api/users/${user._id}/badges/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeId }),
    });

    if (!res.ok) {
      console.error("Failed to add badge", await res.text());
      return;
    }

    user.badges = Array.isArray(user.badges) ? user.badges : [];
    user.badges.push(badgeToUserBadgeShape(selectedBadge));

    currentBadgesEl.innerHTML = (user.badges || [])
      .map(
        (b) => `
          <div class="userBadge" style="display:flex; align-items:center; gap:10px; justify-content:center; padding:8px 10px; border-radius:8px; background: rgba(0,0,0,0.18);">
            <img src="${b.image}" alt="${b.name}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;" />
            <span style="font-weight:700; font-size:14px;">${b.name}</span>
            <button
              type="button"
              class="userBadgeRemoveBtn"
              data-badgeid="${String(b.badgeId ?? b._id ?? "")}" 
              style="margin-left:4px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); color:white; border-radius:8px; padding:6px 10px; cursor:pointer; font-family:'Pixelify Sans', sans-serif; font-weight:700;"
              title="Remove badge"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `
      )
      .join("");

    selectedBadge = null;
    selectedBadgeLabel.innerText = "Selected: None";
    renderBadgeGrid(badgeSearchInput.value);
  };

  modal.onclick = (e) => {
    if (e.target === modal) closeModal(modal);
  };

  renderBadgeGrid("");
}

userSearch?.addEventListener("input", () => {
  const query = userSearch.value.toLowerCase();
  const filteredUsers = allUsers.filter((u) => u.username.toLowerCase().includes(query));
  renderUsers(filteredUsers);
});

(async function init() {
  try {
    await loadBadges();
    await loadUsers();
  } catch (err) {
    console.error("ManageUsers init failed:", err);
  }
})();

