const mainEl = document.querySelector("main");

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderEmpty(message) {
  mainEl.innerHTML = `
    <div class="altWrap">
      <h1>Alt Detection</h1>
      <div class="altEmpty">${escapeHtml(message)}</div>
    </div>
  `;
}

async function putAction(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Action failed");
  }
}

function actionBtn(text, bg, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.style.background = bg;
  b.textContent = text;
  b.onclick = async () => {
    b.disabled = true;
    try {
      await onClick();
      await loadGroups();
    } catch (err) {
      console.error(err);
      alert(err.message || "Action failed");
      b.disabled = false;
    }
  };
  return b;
}

async function loadGroups() {
  try {
    const res = await fetch("/api/altDetection", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Failed to load alt groups");

    const groups = data.groups || [];

    if (groups.length === 0) {
      renderEmpty("No accounts sharing an IP were found.");
      return;
    }

    mainEl.innerHTML = `
      <div class="altWrap">
        <h1>Alt Detection</h1>
        <div class="altGroupList" id="altGroupList"></div>
      </div>
    `;

    const listEl = document.getElementById("altGroupList");

    groups.forEach((group) => {
      const groupEl = document.createElement("div");
      groupEl.className = "altGroup";

      const head = document.createElement("div");
      head.className = "altGroupHead";
      head.innerHTML = `
        <span class="hash">${escapeHtml(group.hashedIp.slice(0, 20))}...</span>
        <span class="count">${group.count} accounts</span>
      `;
      groupEl.appendChild(head);

      group.users.forEach((user) => {
        const row = document.createElement("div");
        row.className = "altUserRow";

        const left = document.createElement("div");
        left.className = "altUserLeft";
        left.innerHTML = `
          <img src="${escapeHtml(user.pfp || "")}" alt="" />
          <div>
            <div class="altUserName">${escapeHtml(user.username)}
              ${user.banned ? '<span class="altStatus banned">Banned</span>' : ""}
              ${user.muted ? '<span class="altStatus muted">Muted</span>' : ""}
            </div>
            <div class="altUserMeta">${escapeHtml(user.role || "Player")}</div>
          </div>
        `;

        const btnRow = document.createElement("div");
        btnRow.className = "altBtnRow";

        if (!user.banned) {
          btnRow.appendChild(
            actionBtn("Ban", "#c94c4c", async () => {
              const reason = prompt("Ban reason:", "Alt account detected") || "Alt account detected";
              await putAction(`/api/users/${user._id}/ban`, { reason, duration: 0 });
            })
          );
        }

        if (!user.muted) {
          btnRow.appendChild(
            actionBtn("Mute", "#c98d5d", async () => {
              const reason = prompt("Mute reason:", "Alt account detected") || "Alt account detected";
              await putAction(`/api/users/${user._id}/mute`, { reason, duration: 0 });
            })
          );
        }

        row.appendChild(left);
        row.appendChild(btnRow);
        groupEl.appendChild(row);
      });

      listEl.appendChild(groupEl);
    });
  } catch (err) {
    console.error(err);
    renderEmpty("Couldn't load alt detection data.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadGroups();
});
