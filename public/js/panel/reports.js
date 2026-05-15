function el(tag, props = {}, styles = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  Object.assign(node.style, styles);
  children.forEach((c) => node.appendChild(c));
  return node;
}

const mainEl = document.querySelector("main");

function renderEmpty() {
  if (!mainEl) return;
  mainEl.innerHTML = "";

  const wrap = el("div", {}, { textAlign: "center", color: "white" });
  wrap.innerHTML = `<h1 style="margin:0;">Reports</h1><p style="opacity:0.85;">No pending reports.</p>`;
  mainEl.appendChild(wrap);
}

async function loadPendingReports() {
  if (!mainEl) return;

  try {
    const res = await fetch("/api/moderationReports/pending", {
      method: "GET",
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Expected JSON but got: ${contentType}. Body: ${text.slice(0, 200)}`
      );
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.message || "Failed to load reports");
    }


    const reports = data.reports || [];

    mainEl.innerHTML = "";

    if (reports.length === 0) {
      const none = el("div", {}, { textAlign: "center", opacity: "0.9" });
      none.textContent = "No pending reports.";
      mainEl.appendChild(none);
      return;
    }

    const grid = el("div", {}, { display: "flex", flexDirection: "column", gap: "14px", width: "min(100%, 980px)", margin: "0 auto" });

    reports.forEach((r) => {
      const card = el("div", {}, {
        background: "#5e046e",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0,0,0,0.6)",
        color: "white",
      });

      const head = el("div", {}, { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" });

      const left = el("div");
      left.innerHTML = `
        <div style="font-size:20px; font-weight:800;">Report: @${r.reportedUsername}</div>
        <div style="opacity:0.85; font-size:14px; margin-top:4px;">Reason: ${escapeHtml(r.reason || '')}</div>
        <div style="opacity:0.7; font-size:12px; margin-top:6px;">By: ${r.reporterUserId || 'unknown'} • ${formatDate(r.createdAt)}</div>
      `;

      const btnRow = el("div", {}, { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" });

      btnRow.appendChild(actionBtn("Dismiss", "#8a8a8a", async () => {
        await postAction(`/api/moderationReports/${r._id}/dismiss`, {});
        await loadPendingReports();
      }));

      btnRow.appendChild(actionBtn("Mute", "#ffa31e", async () => {
        const reason = prompt(`Mute reason for @${r.reportedUsername}:`);
        if (reason === null) return;
        const durationStr = prompt("Mute duration in hours (number):", "1");
        const duration = Number(durationStr);
        await postAction(`/api/moderationReports/${r._id}/mute`, { reason: reason.trim() || undefined, duration: Number.isFinite(duration) ? duration : 0 });
        await loadPendingReports();
      }));

      btnRow.appendChild(actionBtn("Ban", "#ff4d4d", async () => {
        const reason = prompt(`Ban reason for @${r.reportedUsername}:`);
        if (reason === null) return;
        const durationStr = prompt("Ban duration in hours (number, 0 = forever):", "0");
        const duration = Number(durationStr);
        await postAction(`/api/moderationReports/${r._id}/ban`, { reason: reason.trim() || undefined, duration: Number.isFinite(duration) ? duration : 0 });
        await loadPendingReports();
      }));

      head.appendChild(left);
      head.appendChild(btnRow);
      card.appendChild(head);

      grid.appendChild(card);
    });

    mainEl.appendChild(grid);
  } catch (err) {
    console.error(err);
    renderEmpty();
  }
}

function actionBtn(text, bg, onClick) {
  const b = el("button", { type: "button" }, {
    backgroundColor: bg,
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: "Pixelify Sans, sans-serif",
    fontWeight: "bold",
    boxShadow: "inset 0 -0.325vw rgba(0,0,0,0.35), 3px 3px 15px rgba(0,0,0,0.45)",
  });
  b.textContent = text;
  b.onclick = async () => {
    b.disabled = true;
    try {
      await onClick();
    } finally {
      b.disabled = false;
    }
  };
  return b;
}

async function postAction(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Action failed");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
}

function formatDate(d) {
  try {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString();
  } catch {
    return "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPendingReports();
});

