const mainEl = document.querySelector("main");

let allUsers = [];
let selectedUser = null;
let selectedHashedIp = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString();
  } catch {
    return "";
  }
}

function renderShell() {
  mainEl.innerHTML = `
    <div class="blacklistWrap">
      <h1>IP Blacklist</h1>

      <div class="blacklistForm">
        <input type="text" id="userSearchInput" placeholder="Search username..." autocomplete="off" />
      </div>
      <div id="userResults" class="userResults"></div>

      <div id="selectedUserPanel"></div>

      <h2 class="blacklistSubheading">Active Entries</h2>
      <div class="blacklistList" id="blacklistList">
        <div class="blacklistEmpty">Loading...</div>
      </div>
    </div>
  `;

  document.getElementById("userSearchInput").addEventListener("input", (e) => {
    renderUserResults(e.target.value.trim().toLowerCase());
  });
}

function renderUserResults(query) {
  const resultsEl = document.getElementById("userResults");
  if (!query) {
    resultsEl.innerHTML = "";
    return;
  }

  const matches = allUsers
    .filter((u) => u.username.toLowerCase().includes(query))
    .slice(0, 8);

  if (matches.length === 0) {
    resultsEl.innerHTML = `<div class="blacklistEmpty">No matching users.</div>`;
    return;
  }

  resultsEl.innerHTML = matches
    .map(
      (u) => `
        <div class="userResultRow" data-id="${u._id}">
          <img src="${escapeHtml(u.pfp)}" alt="" />
          <span>${escapeHtml(u.username)}</span>
        </div>
      `
    )
    .join("");

  resultsEl.querySelectorAll(".userResultRow").forEach((row) => {
    row.addEventListener("click", () => selectUser(row.dataset.id));
  });
}

async function selectUser(userId) {
  try {
    const res = await fetch(`/api/users/${userId}/ips`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load user's IPs");

    selectedUser = { id: userId, username: data.username };
    selectedHashedIp = null;

    const panel = document.getElementById("selectedUserPanel");

    if (!data.hashedIps || data.hashedIps.length === 0) {
      panel.innerHTML = `
        <div class="selectedUserBox">
          <div class="selectedUserTitle">${escapeHtml(data.username)}</div>
          <div class="blacklistEmpty">This user has no recorded IPs to blacklist.</div>
        </div>
      `;
      return;
    }

    panel.innerHTML = `
      <div class="selectedUserBox">
        <div class="selectedUserTitle">${escapeHtml(data.username)}</div>
        <div class="ipOptionList">
          ${data.hashedIps
            .map(
              (hash, i) => `
                <label class="ipOption">
                  <input type="radio" name="ipChoice" value="${escapeHtml(hash)}" ${i === 0 ? "checked" : ""} />
                  <span class="hash">${escapeHtml(hash.slice(0, 20))}...</span>
                </label>
              `
            )
            .join("")}
        </div>
        <input type="text" id="reasonInput" placeholder="Reason" />
        <input type="number" id="durationInput" placeholder="Hours (0 = forever)" min="0" />
        <button type="button" id="submitBlacklistBtn">Blacklist IP</button>
      </div>
    `;

    selectedHashedIp = data.hashedIps[0];
    panel.querySelectorAll('input[name="ipChoice"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        selectedHashedIp = e.target.value;
      });
    });

    document.getElementById("submitBlacklistBtn").addEventListener("click", submitBlacklist);
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to load user's IPs");
  }
}

async function submitBlacklist() {
  if (!selectedUser || !selectedHashedIp) return;

  const reason = document.getElementById("reasonInput").value.trim();
  const durationHours = document.getElementById("durationInput").value;
  const btn = document.getElementById("submitBlacklistBtn");

  btn.disabled = true;
  try {
    const res = await fetch("/api/ipBlacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userId: selectedUser.id,
        hashedIp: selectedHashedIp,
        reason,
        durationHours,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.message || "Failed to blacklist IP");

    document.getElementById("selectedUserPanel").innerHTML = "";
    document.getElementById("userSearchInput").value = "";
    document.getElementById("userResults").innerHTML = "";
    selectedUser = null;
    selectedHashedIp = null;
    loadEntries();
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to blacklist IP");
  } finally {
    btn.disabled = false;
  }
}

async function loadUsers() {
  try {
    const res = await fetch("/api/users", { credentials: "include" });
    allUsers = await res.json();
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

async function loadEntries() {
  const listEl = document.getElementById("blacklistList");

  try {
    const res = await fetch("/api/ipBlacklist", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Failed to load entries");

    const entries = data.entries || [];

    if (entries.length === 0) {
      listEl.innerHTML = `<div class="blacklistEmpty">No blacklisted IPs.</div>`;
      return;
    }

    listEl.innerHTML = entries
      .map((entry) => {
        const expires = entry.expiresAt ? `Expires ${formatDate(entry.expiresAt)}` : "Never expires";
        const who = (entry.usernames || []).length > 0 ? escapeHtml(entry.usernames.join(", ")) : "Unknown account";
        return `
          <div class="blacklistRow ${entry.active ? "" : "inactive"}">
            <div>
              <div class="who">${who}</div>
              <div class="reason">${escapeHtml(entry.reason)} &middot; ${expires}</div>
            </div>
            ${
              entry.active
                ? `<button class="removeBtn" data-id="${entry._id}">Remove</button>`
                : `<span class="reason">Inactive</span>`
            }
          </div>
        `;
      })
      .join("");

    listEl.querySelectorAll(".removeBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const res = await fetch(`/api/ipBlacklist/${btn.dataset.id}/remove`, {
            method: "POST",
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data?.message || "Failed to remove entry");
          loadEntries();
        } catch (err) {
          console.error(err);
          alert(err.message || "Failed to remove entry");
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div class="blacklistEmpty">Couldn't load the IP blacklist.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderShell();
  await loadUsers();
  loadEntries();
});
