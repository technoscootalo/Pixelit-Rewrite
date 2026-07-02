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

async function revealDevOnlyCards() {
  try {
    const res = await fetch("/api/user", { credentials: "include" });
    if (!res.ok) return;

    const user = await res.json();
    const isDeveloper = ["Owner", "Developer"].includes(user.role);

    if (isDeveloper) {
      document.querySelectorAll(".devOnly").forEach((el) => {
        el.style.display = "flex";
      });
    }
  } catch (err) {
    console.error("Failed to check developer access:", err);
  }
}

async function loadStats() {
  try {
    const res = await fetch("/api/panel/stats", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Failed to load stats");

    const s = data.stats;
    document.getElementById("statTotalUsers").textContent = s.totalUsers.toLocaleString();
    document.getElementById("statBanned").textContent = s.bannedUsers.toLocaleString();
    document.getElementById("statMuted").textContent = s.mutedUsers.toLocaleString();
    document.getElementById("statReports").textContent = s.pendingReports.toLocaleString();
    document.getElementById("statNewToday").textContent = s.newUsersToday.toLocaleString();
    document.getElementById("statTokens").textContent = s.totalTokens.toLocaleString();
  } catch (err) {
    console.error("Failed to load panel stats:", err);
  }
}

async function loadRecentActivity() {
  const container = document.getElementById("recentActivity");
  if (!container) return;

  try {
    const res = await fetch("/api/adminLogs?limit=6", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Failed to load activity");

    const logs = data.logs || [];
    if (logs.length === 0) {
      container.innerHTML = `<div class="activityEmpty">No admin activity yet.</div>`;
      return;
    }

    container.innerHTML = logs
      .map((log) => {
        const verb = ACTION_LABELS[log.action] || log.action;
        return `
          <div class="activityRow">
            <div class="activityMain">
              <b>${escapeHtml(log.actorUsername)}</b> ${escapeHtml(verb)} <b>${escapeHtml(log.targetLabel || "")}</b>
              ${log.reason ? ` &mdash; ${escapeHtml(log.reason)}` : ""}
            </div>
            <div class="activityTime">${formatDate(log.createdAt)}</div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Failed to load recent activity:", err);
    container.innerHTML = `<div class="activityEmpty">Couldn't load recent activity.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  revealDevOnlyCards();
  loadStats();
  loadRecentActivity();
});
