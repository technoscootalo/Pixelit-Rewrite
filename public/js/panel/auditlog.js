const ACTION_LABELS = {
  mute: "muted",
  unmute: "unmuted",
  ban: "banned",
  unban: "unbanned",
  report_dismiss: "dismissed a report on",
  ip_blacklist_add: "blacklisted the IP of",
  ip_blacklist_remove: "un-blacklisted the IP of",
  automod_dismiss: "dismissed an auto-mod flag on",
  automod_mute: "auto-mod muted",
  automod_ban: "auto-mod banned",
};

const ACTION_COLORS = {
  mute: "#ffb347",
  ban: "#ff6d6d",
  unmute: "#8fd694",
  unban: "#8fd694",
  report_dismiss: "#8a8a8a",
  ip_blacklist_add: "#ff6d6d",
  ip_blacklist_remove: "#8fd694",
  automod_dismiss: "#8a8a8a",
  automod_mute: "#ffb347",
  automod_ban: "#ff6d6d",
};

const mainEl = document.querySelector("main");
let currentPage = 1;
let currentAction = "";

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
    <div class="auditWrap">
      <h1>Audit Log</h1>
      <div class="auditFilters">
        <select id="actionFilter">
          <option value="">All actions</option>
          ${Object.keys(ACTION_LABELS)
            .map((a) => `<option value="${a}">${escapeHtml(ACTION_LABELS[a])}</option>`)
            .join("")}
        </select>
      </div>
      <div class="auditList" id="auditList">
        <div class="auditEmpty">Loading...</div>
      </div>
      <div class="auditPager">
        <button id="prevPage" type="button">Prev</button>
        <button id="nextPage" type="button">Next</button>
      </div>
    </div>
  `;

  document.getElementById("actionFilter").addEventListener("change", (e) => {
    currentAction = e.target.value;
    currentPage = 1;
    loadLogs();
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadLogs();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    currentPage += 1;
    loadLogs();
  });
}

async function loadLogs() {
  const listEl = document.getElementById("auditList");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  try {
    const params = new URLSearchParams({ page: String(currentPage), limit: "25" });
    if (currentAction) params.set("action", currentAction);

    const res = await fetch(`/api/adminLogs?${params.toString()}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Failed to load logs");

    const logs = data.logs || [];

    if (logs.length === 0) {
      listEl.innerHTML = `<div class="auditEmpty">No matching activity.</div>`;
    } else {
      listEl.innerHTML = logs
        .map((log) => {
          const verb = ACTION_LABELS[log.action] || log.action;
          const color = ACTION_COLORS[log.action] || "#ffffff";
          return `
            <div class="auditRow">
              <div class="auditMain">
                <b>${escapeHtml(log.actorUsername)}</b> ${escapeHtml(verb)} <b>${escapeHtml(log.targetLabel || "")}</b>
                ${log.reason ? ` &mdash; ${escapeHtml(log.reason)}` : ""}
              </div>
              <span class="auditBadge" style="color:${color};">${escapeHtml(log.action)}</span>
              <div class="auditTime">${formatDate(log.createdAt)}</div>
            </div>
          `;
        })
        .join("");
    }

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage * data.limit >= data.total;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div class="auditEmpty">Couldn't load the audit log.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderShell();
  loadLogs();
});
