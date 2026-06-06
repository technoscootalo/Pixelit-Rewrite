function formatMs(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function startExpiryCountdown(el, getExpiresAtMs) {
  if (!el) return;

  const tick = () => {
    const expiresAtMs = getExpiresAtMs();
    if (!expiresAtMs) {
      el.textContent = "";
      return;
    }
    const remaining = expiresAtMs - Date.now();
    if (remaining <= 0) {
      el.textContent = "Expired";
      return;
    }
    el.textContent = `Expires in ${formatMs(remaining)}`;
  };

  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}

