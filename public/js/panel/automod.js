const mainEl = document.querySelector("main");

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

function renderEmpty(message) {
  mainEl.innerHTML = `
    <div class="automodWrap">
      <h1>Auto Mod</h1>
      <div class="automodEmpty">${escapeHtml(message)}</div>
    </div>
  `;
}

async function postAction(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data?.message || "Action failed");
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
      await loadFlags();
    } catch (err) {
      console.error(err);
      alert(err.message || "Action failed");
      b.disabled = false;
    }
  };
  return b;
}

async function loadFlags() {
  try {
    const res = await fetch("/api/automod/pending", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Failed to load flags");

    const flags = data.flags || [];

    if (flags.length === 0) {
      renderEmpty("No pending auto-mod flags.");
      return;
    }

    mainEl.innerHTML = `
      <div class="automodWrap">
        <h1>Auto Mod</h1>
        <div class="flagList" id="flagList"></div>
      </div>
    `;

    const listEl = document.getElementById("flagList");

    flags.forEach((flag) => {
      const card = document.createElement("div");
      card.className = "flagCard";

      const head = document.createElement("div");
      head.className = "flagHead";
      head.innerHTML = `
        <div class="flagUser">
          <img src="${escapeHtml(flag.pfp || "")}" alt="" />
          <span>@${escapeHtml(flag.username)}</span>
        </div>
      `;

      const reason = document.createElement("div");
      reason.className = "flagReason";
      reason.textContent = `${flag.reason} · Flagged ${formatDate(flag.createdAt)}`;

      const messages = document.createElement("div");
      messages.className = "flagMessages";
      messages.innerHTML = (flag.messages || [])
        .map(
          (m) => `
            <div class="flagMessageRow">
              <span>${escapeHtml(m.content)}</span>
              <span class="flagMessageTime">${formatDate(m.createdAt)}</span>
            </div>
          `
        )
        .join("");

      const btnRow = document.createElement("div");
      btnRow.className = "flagBtnRow";

      btnRow.appendChild(
        actionBtn("Dismiss", "#8a8a8a", async () => {
          await postAction(`/api/automod/${flag._id}/dismiss`, {});
        })
      );

      btnRow.appendChild(
        actionBtn("Mute", "#c98d5d", async () => {
          const reason = prompt("Mute reason:", "Automated spam detection") || "Automated spam detection";
          const duration = Number(prompt("Duration in hours (0 = forever):", "0")) || 0;
          await postAction(`/api/automod/${flag._id}/mute`, { reason, duration });
        })
      );

      btnRow.appendChild(
        actionBtn("Ban", "#c94c4c", async () => {
          const reason = prompt("Ban reason:", "Automated spam detection") || "Automated spam detection";
          const duration = Number(prompt("Duration in hours (0 = forever):", "0")) || 0;
          await postAction(`/api/automod/${flag._id}/ban`, { reason, duration });
        })
      );

      card.appendChild(head);
      card.appendChild(reason);
      card.appendChild(messages);
      card.appendChild(btnRow);
      listEl.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    renderEmpty("Couldn't load auto-mod flags.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadFlags();
});
