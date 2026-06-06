async function fetchInventory() {
  const res = await fetch('/api/inventory', {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    return { items: [] };
  }

  try {
    return await res.json();
  } catch {
    return { items: [] };
  }
}

function ensureBoostersContainer() {
  let container = document.getElementById('boosters-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'boosters-container';
    container.style.marginLeft = '240px';
    container.style.color = 'white';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const main = document.querySelector('main');
    if (main) {
      main.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  return container;
}

function formatTimeLeft(expiresAt) {
  try {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  } catch {
    return null;
  }
}

async function activateBooster(boosterCode) {
  try {
    const res = await fetch(`/api/boosters/activate/${encodeURIComponent(boosterCode)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Accept": "application/json" },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data?.error || "Failed to activate booster");
      return;
    }

    const { items } = await fetchInventory();
    renderBoosters(items);

  } catch (e) {
    console.error(e);
    alert("Failed to activate booster");
  }
}

function renderBoosters(items) {
  const container = ensureBoostersContainer();
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "booster-item";
    card.style.border = "1px solid rgba(255,255,255,0.25)";
    card.style.borderRadius = "12px";
    card.style.padding = "14px";
    card.style.background = "rgba(0,0,0,0.15)";

    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.justifyContent = "space-between";
    topRow.style.gap = "12px";

    const left = document.createElement("div");
    left.style.minWidth = "0";

    const name = document.createElement("div");
    name.textContent = item.name;
    name.style.fontSize = "20px";
    name.style.fontWeight = "bold";

    const code = document.createElement("div");
    code.textContent = item.code;
    code.style.opacity = "0.75";
    code.style.marginTop = "4px";

    left.appendChild(name);
    left.appendChild(code);


    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.flexDirection = "column";
    right.style.alignItems = "flex-end";
    right.style.gap = "8px";

    const status = document.createElement("div");
    status.style.fontWeight = "800";
    status.style.fontSize = "14px";
    status.style.color = "rgba(255,255,255,0.95)";

    const timeLeft = formatTimeLeft(item.expiresAt);
    if (item.status === "active" && timeLeft && timeLeft !== "Expired") {
      status.textContent = `Active • ${timeLeft}`;
      status.style.color = "#4bc22e";

      if (!document.getElementById('booster-pulse-style')) {
        const s = document.createElement('style');
        s.id = 'booster-pulse-style';
        s.textContent = `@keyframes boosterPulse{0%{box-shadow:0 0 8px rgba(75,194,46,0.35)}50%{box-shadow:0 0 24px rgba(75,194,46,0.6)}100%{box-shadow:0 0 8px rgba(75,194,46,0.35)}} .booster-pulse{animation:boosterPulse 2s ease-in-out infinite;border-color:#6fe56a}`;
        document.head.appendChild(s);
      }
      card.classList.add('booster-pulse');
    } else {
      status.textContent = `Inactive`;
      status.style.color = "rgba(255,255,255,0.75)";
    }

    const btn = document.createElement("button");
    btn.textContent = item.status === "active" && timeLeft !== "Expired" ? "Activated" : "Activate";
    btn.disabled = item.status === "active" && timeLeft !== "Expired";
    btn.style.height = "38px";
    btn.style.padding = "0 14px";
    btn.style.borderRadius = "10px";
    btn.style.border = "2px solid rgba(255,255,255,0.18)";
    btn.style.cursor = btn.disabled ? "not-allowed" : "pointer";
    btn.style.fontFamily = "'Pixelify Sans', sans-serif";
    btn.style.fontWeight = "900";
    btn.style.fontSize = "14px";
    btn.style.background = btn.disabled ? "rgba(255,255,255,0.08)" : "#3aab3a";
    btn.style.color = "white";
    btn.style.boxShadow = "inset 0 -0.265vw rgba(0,0,0,0.25), 3px 3px 14px rgba(0,0,0,0.5)";

    btn.onclick = () => {
      try {
        card.animate(
          [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(1.03)", filter: "brightness(1.25)" },
            { transform: "scale(1)", filter: "brightness(1)" },
          ],
          { duration: 500, easing: "cubic-bezier(0.2, 0.9, 0.2, 1)" }
        );

        card.style.boxShadow = "0 0 24px rgba(75, 194, 46, 0.55)";
        setTimeout(() => {
          card.style.boxShadow = "";
        }, 650);
      } catch {}

      if (!btn.disabled) activateBooster(item.code);
    };


    right.appendChild(status);
    right.appendChild(btn);

    topRow.appendChild(left);
    topRow.appendChild(right);

    card.appendChild(topRow);
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const { items } = await fetchInventory();
  renderBoosters(items);
});


