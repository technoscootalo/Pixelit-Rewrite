let userTokens = 0;
let userRole = null;

function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const rarityColors = {
  uncommon: "#4bc22e",
  rare: "blue",
  epic: "#be0000",
  legendary: "#ff910f",
  chroma: "#00ccff",
  mystical: "#9935dd"
};

function showModal(message, redirectToLogin = false) {
  const modal = document.createElement("div");

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  const box = document.createElement("div");

  box.style.cssText = `
    background-color: #6f057a;
    box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0,0,0,0.6);
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    min-width: 280px;
    color: white;
    font-family: Pixelify Sans;
    font-size: 18px;
  `;

  box.innerText = message;

  modal.appendChild(box);
  document.body.appendChild(modal);

  modal.onclick = () => modal.remove();

  if (redirectToLogin) {
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchUser();
  fetchPacks();
});

async function fetchUser() {
  try {
    const res = await fetch("/api/user", {
      method: "GET",
      credentials: "include"
    });

    if (res.status === 401) {
      showModal("Not logged in", true);
      return;
    }

    if (!res.ok) throw new Error("Failed to load user");

    const user = await res.json();

    userTokens = user.tokens || 0;
    userRole = user.role || null;
    updateTokens();
    checkPanelAccess();

  } catch (err) {
    console.error(err);
    showModal("Error loading user");
  }
}

function updateTokens() {
  const el = document.getElementById("tokens");
  if (el) el.innerText = userTokens.toLocaleString();
}

async function fetchPacks() {
  try {
    const res = await fetch("/api/packs");

    if (!res.ok) throw new Error("Failed to load packs");

    const packs = await res.json();
    displayPacks(packs);

  } catch (err) {
    console.error(err);
    showModal("Error loading packs");
  }
}

function displayPacks(packs) {
  const container = document.getElementById("packContainer");
  if (!container) return;

  container.innerHTML = "";

  packs.forEach(pack => {
    container.appendChild(createPack(pack));
  });
}

function createPack(pack) {
  const div = document.createElement("div");
  div.className = "box";
  div.setAttribute("data-pack-name", pack.name);

  const img = document.createElement("img");
  img.src = pack.image;
  img.alt = pack.name;

  img.style.cssText = `
    width:145px;
    height:145px;
    transform: rotate(6deg);
    filter: drop-shadow(0 10px 12px rgba(0,0,0,0.5));
    transition: 0.25s;
    cursor: pointer;
  `;

  img.onmouseenter = () => {
    img.style.transform = "rotate(0deg) scale(1.08)";
    img.style.filter = "drop-shadow(0 15px 20px rgba(0,0,0,0.6))";
  };

  img.onmouseleave = () => {
    img.style.transform = "rotate(6deg) scale(1)";
    img.style.filter = "drop-shadow(0 10px 12px rgba(0,0,0,0.5))";
  };

  const cost = document.createElement("p");
  cost.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
    gap:6px;
    color:white;
    font-weight:bold;
    font-size: 32px;
    text-shadow:0 2px 4px rgba(0,0,0,0.5);
  `;

  cost.innerHTML = `
    <img src="https://izumiihd.github.io/pixelitcdn/assets/img/icons/token.png"
      style="width:28px;height:28px;filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));">
    ${pack.cost}
  `;

  div.appendChild(img);
  div.appendChild(document.createElement("br"));
  div.appendChild(cost);

  div.onclick = () => openPack(pack);

  return div;
}

/* =========================
   OPEN PACK
========================= */
async function openPack(pack) {
  if (userTokens < pack.cost) {
    showModal("Not enough tokens!");
    return;
  }

  try {
    const res = await fetch(`/api/packs/open/${encodeURIComponent(pack.name)}`, {
      method: "POST",
      credentials: "include"
    });

    if (res.status === 401) {
      showModal("Not logged in", true);
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to open pack");
    }

    const data = await res.json();

    userTokens = data.tokens;
    updateTokens();

    showResult(data.blook);

  } catch (err) {
    console.error(err);
    showModal(err.message);
  }
}

/* =========================
   RESULT MODAL
========================= */
function showResult(blook) {
  const overlay = document.createElement("div");

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.7);
    z-index:999;
  `;

  const box = document.createElement("div");

  const rarity = blook.rarity || "unknown";
  const color = rarityColors[rarity.toLowerCase()] || "white";

  box.style.cssText = `
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    background:radial-gradient(circle, #6f057a, #4a034f);
    width:370px;
    height:385px;
    border-radius:10px;
    box-shadow: inset 0 -0.365vw #330838, 3px 3px 15px rgba(0,0,0,0.6);
    text-align:center;
    color:white;
    padding:20px;
  `;

  box.innerHTML = `
    <h2 style=font-weight:bold;font-size: 34px; text-shadow: -1px -1px 0 black,1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black; " >${blook.name}</h2>
    <p style="color:${color}; font-weight:bold; font-size: 20px; text-shadow: -1px -1px 0 black,
    1px -1px 0 black,
    -1px 1px 0 black,
    1px 1px 0 black; ">
      ${capitalize(rarity)}
    </p>
    <img src="${blook.imageUrl}" style="width:165px;height:170px;">
    <p style="font-size:30px; font-weight:bold;">${blook.chance}%</p>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.onclick = () => overlay.remove();
}