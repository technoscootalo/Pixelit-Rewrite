let userTokens = 0;
let userRole = null;
let phaserGame = null;
let marketBoosterActive = false;

function triggerRaritySpecificParticles(rarity) {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }

  const particleUrls = [];

  const baseConfig = {
    type: Phaser.WEBGL,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-particle-parent',
    transparent: true,
    scene: {
      preload: function () {
        for (let i = 0; i < particleUrls.length; i++) {
          this.load.svg((i + 1).toString(), particleUrls[i], { width: 30, height: 30 });
        }
      },
      create: null
    }
  };

  switch (rarity) {
    case 'Common':
    case 'Uncommon':
      particleUrls.push(
        "https://media.blooket.com/image/upload/v1658567787/Media/market/particles/square_green.svg",
        "https://media.blooket.com/image/upload/v1658567787/Media/market/particles/square_light_green.svg",
        "https://media.blooket.com/image/upload/v1658567785/Media/market/particles/circle_dark_green.svg",
        "https://media.blooket.com/image/upload/v1658567785/Media/market/particles/serpentine_dark_green.svg",
        "https://media.blooket.com/image/upload/v1658567785/Media/market/particles/triangle_light_green.svg",
        "https://media.blooket.com/image/upload/v1658567785/Media/market/particles/serpentine_light_green.svg",
        "https://media.blooket.com/image/upload/v1658567785/Media/market/particles/triangle_green.svg"
      );
      baseConfig.scene.create = function () {
        const particles = Array(7).fill(null).map((_, i) => this.add.particles((i + 1).toString()));
        const emitters = particles.map(p =>
          p.createEmitter({
            speed: { min: 700, max: 800 },
            angle: { min: -115, max: -65 },
            gravityY: 700,
            frequency: 75,
            lifespan: 5000,
            x: { min: window.innerWidth / 2 - 25, max: window.innerWidth / 2 + 25 },
            y: window.innerHeight / 2 + 25
          })
        );
        setTimeout(() => emitters.forEach(e => e.stop()), 1500);
      };
      break;
    case 'Rare':
      particleUrls.push(
        "https://media.blooket.com/image/upload/v1658567765/Media/market/particles/square_light_blue.svg",
        "https://media.blooket.com/image/upload/v1658567765/Media/market/particles/square_dark_blue.svg",
        "https://media.blooket.com/image/upload/v1658567763/Media/market/particles/triangle_blue.svg",
        "https://media.blooket.com/image/upload/v1658567763/Media/market/particles/serpentine_blue.svg",
        "https://media.blooket.com/image/upload/v1658567763/Media/market/particles/triangle_light_blue.svg",
        "https://media.blooket.com/image/upload/v1658567763/Media/market/particles/serpentine_light_blue.svg",
        "https://media.blooket.com/image/upload/v1658567763/Media/market/particles/circle_dark_blue.svg"
      );
      baseConfig.scene.create = function () {
        const particles = Array(7).fill(null).map((_, i) => this.add.particles((i + 1).toString()));
        const emitters = [];
        particles.forEach(p => {
          emitters.push(
            p.createEmitter({
              speed: { min: 700, max: 750 },
              angle: { min: -70, max: -20 },
              gravityY: 500,
              frequency: 75,
              lifespan: 5000,
              x: { min: -25, max: 25 },
              y: window.innerHeight
            })
          );
          emitters.push(
            p.createEmitter({
              speed: { min: 700, max: 750 },
              angle: { min: -160, max: -110 },
              gravityY: 500,
              frequency: 75,
              lifespan: 5000,
              x: { min: window.innerWidth - 25, max: window.innerWidth + 25 },
              y: window.innerHeight
            })
          );
        });
        setTimeout(() => emitters.forEach(e => e.stop()), 1500);
      };
      break;
    case 'Epic':
      particleUrls.push(
        "https://media.blooket.com/image/upload/v1658790239/Media/market/particles/red.svg",
        "https://media.blooket.com/image/upload/v1658790237/Media/market/particles/light_red.svg",
        "https://media.blooket.com/image/upload/v1658790239/Media/market/particles/serpentine_red.svg",
        "https://media.blooket.com/image/upload/v1658790239/Media/market/particles/serpentine_dark_red.svg",
        "https://media.blooket.com/image/upload/v1658790237/Media/market/particles/triangle_red.svg",
        "https://media.blooket.com/image/upload/v1658790237/Media/market/particles/triangle_light_red.svg",
        "https://media.blooket.com/image/upload/v1658790237/Media/market/particles/circle_dark_red.svg"
      );
      baseConfig.scene.create = function () {
        const particles = Array(7).fill(null).map((_, i) => this.add.particles((i + 1).toString()));
        particles.forEach(p => {
          p.createEmitter({
            speed: 650,
            angle: { min: -50, max: 0 },
            gravityY: 400,
            frequency: 65,
            lifespan: 5000,
            x: 0,
            y: { min: 0, max: window.innerHeight }
          });
          p.createEmitter({
            speed: 650,
            angle: { min: -180, max: -130 },
            gravityY: 400,
            frequency: 65,
            lifespan: 5000,
            x: window.innerWidth,
            y: { min: 0, max: window.innerHeight }
          });
        });
      };
      break;
    case 'Legendary':
      particleUrls.push(
        "https://media.blooket.com/image/upload/v1658567740/Media/market/particles/square_orange.svg",
        "https://media.blooket.com/image/upload/v1658567740/Media/market/particles/square_light_orange.svg",
        "https://media.blooket.com/image/upload/v1658567738/Media/market/particles/circle_orange.svg",
        "https://media.blooket.com/image/upload/v1658567738/Media/market/particles/serpentine_orange.svg",
        "https://media.blooket.com/image/upload/v1658567738/Media/market/particles/serpentine_light_orange.svg",
        "https://media.blooket.com/image/upload/v1658567738/Media/market/particles/circle_dark_orange.svg",
        "https://media.blooket.com/image/upload/v1658567738/Media/market/particles/triangle_dark_orange.svg"
      );
      baseConfig.scene.create = function () {
        const particles = Array(7).fill(null).map((_, i) => this.add.particles((i + 1).toString()));
        particles.forEach(p =>
          p.createEmitter({
            speed: 500,
            angle: 90,
            gravityY: 300,
            frequency: 65,
            lifespan: 5000,
            x: { min: 0, max: window.innerWidth },
            y: -50
          })
        );
      };
      break;
    case 'Chroma':
    case 'Mystical':
      particleUrls.push(
        "https://media.blooket.com/image/upload/v1658790246/Media/market/particles/square_light_turquoise.svg",
        "https://media.blooket.com/image/upload/v1658790246/Media/market/particles/square_light_turquoise.svg",
        "https://media.blooket.com/image/upload/v1658790244/Media/market/particles/serpentine_dark_turquoise.svg",
        "https://media.blooket.com/image/upload/v1658790244/Media/market/particles/serpentine_turquoise.svg",
        "https://media.blooket.com/image/upload/v1658790244/Media/market/particles/triangle_turquoise.svg",
        "https://media.blooket.com/image/upload/v1658790244/Media/market/particles/triangle_light_turquoise.svg",
        "https://media.blooket.com/image/upload/v1658790244/Media/market/particles/circle_dark_turquoise.svg"
      );
      baseConfig.scene.create = function () {
        const particles = Array(7).fill(null).map((_, i) => this.add.particles((i + 1).toString()));
        particles.forEach(p => {
          p.createEmitter({
            speed: 700,
            angle: -30,
            frequency: 350,
            lifespan: 3000,
            y: { min: window.innerHeight - 651, max: window.innerHeight },
            x: 0
          });
          p.createEmitter({
            speed: 700,
            angle: -150,
            frequency: 350,
            lifespan: 3000,
            y: { min: window.innerHeight - 651, max: window.innerHeight },
            x: window.innerWidth
          });
          p.createEmitter({
            speed: 700,
            angle: 30,
            frequency: 350,
            lifespan: 3000,
            y: { min: 0, max: 601 },
            x: 0
          });
          p.createEmitter({
            speed: 700,
            angle: -210,
            frequency: 350,
            lifespan: 3000,
            y: { min: 0, max: 601 },
            x: window.innerWidth
          });
        });
      };
      break;
      default:
      return;
  }

  phaserGame = new Phaser.Game(baseConfig);
}

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

let __packTooltipsInFlight = false;
let __cachedPacksForTooltips = null;

function rarityColor(rarity) {
  const map = {
    Common: "white",
    Uncommon: "#4bc22e",
    Rare: "blue",
    Epic: "#be0000",
    Legendary: "#ff910f",
    Chroma: "#00ccff",
    Mystical: "#9935dd",
  };
  return map[rarity] || "white";
}

async function openPackTooltipsModal() {
  if (__packTooltipsInFlight) return;
  __packTooltipsInFlight = true;

  try {
    if (!__cachedPacksForTooltips) {
      const res = await fetch("/api/packs");
      if (res.status === 401) {
        showModal("Not logged in", true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load packs");
      __cachedPacksForTooltips = await res.json();
    }

    const packs = __cachedPacksForTooltips || [];
    const existing = document.getElementById("pack-tooltips-modal");
    existing?.remove();

    const overlay = document.createElement("div");
    overlay.id = "pack-tooltips-modal";
    overlay.className = "packTooltipsOverlay";
    
    const modal = document.createElement("div");
    modal.className = "packTooltipsModal";

    const closeBtn = document.createElement("button");
    closeBtn.className = "packTooltipsClose";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => overlay.remove());

    const title = document.createElement("h2");
    title.className = "packTooltipsTitle";
    title.textContent = "Pack Contents & Chances";

    const content = document.createElement("div");
    content.className = "packTooltipsContent";

    const rarityOrder = ["Uncommon", "Rare", "Epic", "Legendary", "Chroma", "Mystical", "Common"];
    const rarityRank = (r) => {
      const idx = rarityOrder.indexOf(r);
      return idx === -1 ? 999 : idx;
    };

    packs.forEach((pack) => {
      const packSection = document.createElement("section");
      packSection.className = "packTooltipsPack";

      const header = document.createElement("div");
      header.className = "packTooltipsPackHeader";
      header.innerHTML = `
        <div class="packTooltipsPackName">${pack?.name || "Unknown Pack"}</div>
        <div class="packTooltipsPackCost">
          <img class="packTooltipsTokenIcon" src="https://izumiihd.github.io/pixelitcdn/assets/img/icons/token.png" alt="Token" />
          ${pack?.cost ?? 0}
        </div>
      `;

      const list = document.createElement("div");
      list.className = "packTooltipsBlooks";

      const blooks = Array.isArray(pack?.blooks) ? pack.blooks : [];
      const sortedBlooks = [...blooks].sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity));

      sortedBlooks.forEach((b) => {
        const name = b?.blookName || b?.name || b?.title || "Unknown";
        const rarity = b?.rarity || "Common";
        const rawChance = b?.chance ?? b?.probability ?? b?.dropChance ?? 0;

        const item = document.createElement("div");
        item.className = "packTooltipsBlookItem";
        item.innerHTML = `
          <img class="packTooltipsBlookImg" src="${b?.imageUrl || ""}" alt="${name}" />
          <div class="packTooltipsBlookMeta">
            <div class="packTooltipsBlookName">${name}</div>
            <div class="packTooltipsBlookBadges">
              <span class="packTooltipsRarity" style="color:${typeof rarityColor === 'function' ? rarityColor(rarity) : '#fff'}">${rarity}</span>
              <span class="packTooltipsChance">${rawChance}%</span>
            </div>
          </div>
        `;
        list.appendChild(item);
      });

      packSection.appendChild(header);
      packSection.appendChild(list);
      content.appendChild(packSection);
    });

    modal.append(closeBtn, title, content);
    overlay.appendChild(modal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);

  } catch (err) {
    console.error(err);
    if (typeof showModal === 'function') showModal(err?.message || "Error loading pack tooltips");
  } finally {
    __packTooltipsInFlight = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchUser();
  fetchPacks();
  // fetchBoosters();
  fetchMarketActiveBoosters();

  const btn = document.getElementById("packToolTips");
  if (btn) btn.addEventListener("click", openPackTooltipsModal);
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
  const el = document.getElementById("tokenAmount");
  if (el) el.innerText = userTokens.toLocaleString();
}


async function fetchPacks() {
  try {
    const res = await fetch("/api/packs");

    const text = await res.text();
    if (!res.ok) {
      console.error("Failed to load packs:", text);
      throw new Error("Failed to load packs");
    }

    const packs = JSON.parse(text);
    displayPacks(packs);

  } catch (err) {
    console.error(err);
    showModal("Error loading packs");
  }
}

/* 
async function fetchBoosters() {
  try {
    const res = await fetch("/api/boosters");
    if (!res.ok) throw new Error("Failed to load boosters");

    const data = await res.json();
    const boosters = Array.isArray(data?.boosters) ? data.boosters : [];

    const container = document.getElementById("boosterContainer");
    if (!container) return;

    container.innerHTML = "";

    boosters.forEach((booster) => {
      container.appendChild(createBoosterCard(booster));
    });
  } catch (err) {
    console.error(err);
  }
}
*/

function upsertMarketActiveBoostersSection(boosters) {

  const parent = document.getElementById("boosterContainer") || document.body;

  let section = document.getElementById("marketActiveBoostersSection");
  if (!section) {
    section = document.createElement("div");
    section.id = "marketActiveBoostersSection";
    section.className = "marketActiveBoostersSection";
    section.style.cssText = `margin-top:18px; padding:12px; border-radius:12px; background:rgba(0,0,0,0.25); color:#fff;`;
    parent.appendChild(section);
  }

  if (!boosters || boosters.length === 0) {
    section.innerHTML = `<div style="opacity:0.85;font-size:14px;">No active boosters right now.</div>`;
    return section;
  }

  const cardsHtml = boosters
    .map((b, idx) => {
      const expiresAtIso = b?.expiresAt || null;
      const expiresAtLocal = formatDateTime(expiresAtIso);
      return `
        <div class="marketActiveBoosterCard" data-idx="${idx}" style="display:flex;gap:10px;align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.12);">
          <div style="min-width:38px;text-align:center; font-weight:700; color:#7CFF6B;">x${b?.multiplier ?? 1}</div>
          <div style="flex:1;">
            <div style="font-weight:700;">Activated by ${b?.activatedBy || "Unknown"}</div>
            <div style="opacity:0.85;font-size:13px;">${b?.boosterName || "Booster"} • ${expiresAtLocal ? `expires ${expiresAtLocal}` : "expires"}</div>
            <div class="marketActiveBoosterCountdown" style="opacity:0.9; font-size:13px;" data-expires-at-ms="${b?._expiresAtMs ?? 0}"></div>
          </div>
        </div>
      `;
    })
    .join("");

  section.innerHTML = `
    <div style="font-weight:800; margin-bottom:8px;">Active Booster in Market</div>
    ${cardsHtml}
  `;

  const els = section.querySelectorAll(".marketActiveBoosterCountdown");
  els.forEach((el) => {
    const expiresAtMs = Number(el.getAttribute("data-expires-at-ms") || 0);
    if (!expiresAtMs) return;
    startExpiryCountdown(el, () => expiresAtMs);
  });

  return section;
}

async function fetchMarketActiveBoosters() {

  try {
    const res = await fetch("/api/market/boosters/market-active-boosters", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to load market active boosters");

    const data = await res.json();
    const boosters = Array.isArray(data?.boosters) ? data.boosters : [];

    const enriched = boosters.map((b) => {
      let ms = 0;
      if (b?.expiresAt) {
        const d = new Date(b.expiresAt);
        ms = Number(d.getTime());
      }
      return { ...b, _expiresAtMs: ms };
    });

    marketBoosterActive = enriched.length > 0;

    upsertMarketActiveBoostersSection(enriched);
  } catch (err) {
    console.error(err);
  }
}

function createBoosterCard(booster) {
  const div = document.createElement("div");
  div.className = "boosterCard";

  const img = document.createElement("img");
  img.className = "boosterCardImg";
  img.src = booster?.image || "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/placeholder.png";
  img.alt = booster?.name || "Booster";

  const meta = document.createElement("div");
  meta.className = "boosterCardMeta";

  const name = document.createElement("div");
  name.className = "boosterCardName";
  name.textContent = booster?.name || "Unknown";

  const desc = document.createElement("div");
  desc.className = "boosterCardDesc";
  desc.textContent = booster?.description || "";

  const priceRow = document.createElement("div");
  priceRow.className = "boosterCardPriceRow";

  const tokenIcon = document.createElement("img");
  tokenIcon.className = "boosterTokenIcon";
  tokenIcon.src = "https://izumiihd.github.io/pixelitcdn/assets/img/icons/token.png";
  tokenIcon.alt = "Token";

  const price = document.createElement("div"); 
  price.className = "boosterCardPrice"; 
  price.textContent = (booster?.price ?? 0).toLocaleString();

  priceRow.appendChild(tokenIcon);
  priceRow.appendChild(price);

  const buyBtn = document.createElement("button");
  buyBtn.className = "boosterBuyBtn";
  buyBtn.textContent = "Buy";
  buyBtn.onclick = async (e) => {
    e.stopPropagation();
    if (userTokens < Number(booster?.price ?? 0)) {
      showModal("Not enough tokens!");
      return;
    }

    try {
      if (typeof window.showLoader === "function") window.showLoader();
      const res = await fetch(`/api/market/boosters/buy/${encodeURIComponent(booster?.code || "")}`, {
        method: "POST",
        credentials: "include",
        headers: { "Accept": "application/json" },
      });

      if (res.status === 401) {
        showModal("Not logged in", true);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showModal(data?.error || "Failed to buy booster");
        return;
      }

      userTokens = data?.tokens ?? userTokens;
      updateTokens();
      showModal(`Purchased ${booster?.name || "booster"}!`);

    } catch (err) {
      console.error(err);
      showModal("Failed to buy booster");
    } finally {
      if (typeof window.hideLoader === "function") window.hideLoader();
    }
  };

  meta.appendChild(name);
  meta.appendChild(desc);
  meta.appendChild(priceRow);
  meta.appendChild(buyBtn);

  div.appendChild(img);
  div.appendChild(meta);

  return div;
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

  div.style.position = "relative";
  div.style.overflow = "hidden"; 
  div.style.borderRadius = "15px"; 
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.alignItems = "center";
  div.style.justifyContent = "center";
  
    div.style.border = "6px solid rgba(238, 238, 238, 0.57)";
    div.style.boxSizing = "border-box";

    div.style.borderRadius = "20px"; 
    div.style.backgroundClip = "padding-box";
  
  div.style.display = "flex";
  
  const backgrounds = {
    "OG Pack": "radial-gradient(circle, #ADD8E6, #335494)",
    "Color Pack": "radial-gradient(circle, #FFFF00, #8B8000)",
    "Fall Pack": "radial-gradient(circle, #DEB887, #8B4513)",
    "Halloween Pack": "radial-gradient(circle, #39272d, #67433e)",
    "Christmas Pack": "radial-gradient(circle, rgb(46, 139, 87), rgb(30, 86, 49), rgb(12, 45, 28), rgb(5, 20, 11))",
    "Space Pack": "radial-gradient(circle, #808080, #00008B)",
    "Technology Pack": "radial-gradient(circle, #346136, #2faa34)",
    "School Pack": "radial-gradient(circle, #836048, #66423a)",
    "Emoji Pack": "radial-gradient(circle, #fff176 0%, #fbc02d 60%, #f57f17 100%)",
    "Miscellaneous": "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
  };

  div.style.background = backgrounds[pack.name] || "#5e046e";
  div.style.boxShadow = "3px 3px 15px rgba(0, 0, 0, 0.6)";

  const img = document.createElement("img");
  img.src = pack.packImageUrl;
  img.alt = pack.name;
  img.style.cssText = `
    width: 145px;
    height: 145px;
    margin-top: 20px;
    margin-bottom: 70px;
    transform: rotate(6deg);
    filter: drop-shadow(0 10px 12px rgba(0,0,0,0.5));
    transition: 0.25s;
    cursor: pointer;
    object-fit: contain;
  `;

  img.onmouseenter = () => {
    img.style.transform = "rotate(0deg) scale(1.08)";
    img.style.filter = "drop-shadow(0 15px 20px rgba(0,0,0,0.6))";
  };
  img.onmouseleave = () => {
    img.style.transform = "rotate(6deg) scale(1)";
    img.style.filter = "drop-shadow(0 10px 12px rgba(0,0,0,0.5))";
  };

  const cost = document.createElement("div");
  cost.style.cssText = `
    display: flex;
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0; 
    flex-direction: row;
    justify-content: center;
    align-items: center;    
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
    height: 55px;
    color: #fff;
    font-size: 26px;
    font-family: var(--font-titan);
    text-shadow: 2px 2px rgba(0,0,0,.2);
    box-sizing: border-box;
    margin: 0;
  `;

  cost.innerHTML = `
    <img src="https://izumiihd.github.io/pixelitcdn/assets/img/icons/token.png" 
         style="width:28px; height:28px; margin-right: 8px; filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));">
    ${pack.cost}
  `;

  div.appendChild(img);
  div.appendChild(cost);

  div.onclick = (e) => {
    e.stopPropagation();
    openPack(pack, img);
  };

  return div;
}

function confirmPurchase(pack) {
  return new Promise((resolve) => {
    if (typeof window.hideLoader === "function") window.hideLoader();

    const overlay = document.createElement("div");
    overlay.className = "sell-blook-modal-overlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
      display: flex; justify-content: center; align-items: center; z-index: 99999;
    `;

    const modalBox = document.createElement("div");
    modalBox.className = "sell-blook-modal-box";
    modalBox.style.cssText = `
      padding: 25px; width: 400px; border-radius: 8px; text-align: center;
      color: white; font-family: 'Pixelify Sans', sans-serif;
      background: #5e046e; box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);
    `;

    modalBox.innerHTML = `
      <h3 class="cofirmBlookPurchase">Purchase ${pack.name} for ${pack.cost} tokens?</h3>
      <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
        <button id="purchaseYes" class="purchase-confirm-btn primary-action-btn">Confirm</button>
        <button id="purchaseNo" class="purchase-cancel-btn secondary-action-btn">Cancel</button>
      </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    const yesBtn = modalBox.querySelector("#purchaseYes");
    const noBtn = modalBox.querySelector("#purchaseNo");

    yesBtn.onclick = () => {
      if (typeof window.showLoader === "function") window.showLoader();
      overlay.remove();
      resolve(true);
    };

    noBtn.onclick = () => {
      overlay.remove();
      resolve(false);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
  });
}

let __openPackInFlight = false;

async function openPack(pack) {
  if (__openPackInFlight) return;
  __openPackInFlight = true;

  if (typeof window.showLoader === "function") window.showLoader();

  try {
    const instantOpen = localStorage.getItem("instantOpen") === "On";

    if (userTokens < pack.cost) {
      showModal("Not enough tokens!");
      return;
    }

    if (!instantOpen) {
      const confirmed = await confirmPurchase(pack);
      if (!confirmed) return;
    }

    const res = await fetch(`/api/packs/open/${encodeURIComponent(pack.name)}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
      },
    });

    if (res.status === 401) {
      showModal("Not logged in", true);
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error || "Failed to open pack";
      showModal(errMsg);
      return;
    }

    userTokens = data.tokens;
    updateTokens();

    showResult(data.blook, {
      packBackground: pack.packBackground,
      phase: "reveal",
      revealDelayMs: 0,
      skipIntro: true,
    });

  } catch (err) {
    console.error(err);
    showModal(err.message || "Something went wrong");
  } finally {
    __openPackInFlight = false;
    if (typeof window.hideLoader === "function") window.hideLoader();
  }
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function animateBox(box, keyframes, options) {
  return box.animate(keyframes, options).finished;
}

async function showResult(blook, pack = null) {
  const overlay = document.createElement("div");
  const skipIntro = !!pack?.skipIntro;
  const adjustedChance = Number.isFinite(Number(blook?.adjustedChance))
    ? Number(blook.adjustedChance)
    : null;

  const baseCenter = "translate(-50%, -50%)";

  const phase = pack?.phase || "reveal";
  const packBg = pack?.packBackground || "";

  const isImageUrl = (v) =>
    v && /^(https?:\/\/|\/|data:image\/)/i.test(String(v).trim());

  const overlayBg = packBg
    ? (isImageUrl(packBg) ? `url(${packBg})` : packBg)
    : "radial-gradient(circle, rgb(51, 8, 56), rgb(74, 3, 79))";

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background-image: ${overlayBg};
    background-size: cover;
    background-position: center;
  `;

  const box = document.createElement("div");

  const baseStyle = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 370px;
    height: 385px;
    border-radius: 10px;
    text-align: center;
    color: white;
    padding: 20px;
    cursor: pointer;
    transform: translate(-50%, -50%);
    background-size: cover;
    background-position: center;
    opacity: 0;
    text-shadow:
      -1px -1px 0 black,
       1px -1px 0 black,
      -1px  1px 0 black,
       1px  1px 0 black;
  `;

  const boxShadowStyle = `
    box-shadow:
      inset 0 0 80px rgba(0,0,0,0.55),
      inset 0 0 140px rgba(0,0,0,0.35),
      inset 0 -6px rgba(0,0,0,0.4),
      3px 3px 15px rgba(0,0,0,0.6);
  `;

  if (phase === "pack") {
    box.style.cssText = baseStyle + boxShadowStyle;

    box.style.backgroundImage = pack?.packBackground
      ? (isImageUrl(pack.packBackground)
          ? `url(${pack.packBackground})`
          : pack.packBackground)
      : "radial-gradient(circle, #6f057a, #4a034f)";

    box.innerHTML = `<h1>${blook?.name || ""}</h1>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.onclick = () => overlay.remove();
    return;
  }

  const rarity = blook.rarity || "Common";
  const color = rarityColors?.[rarity?.toLowerCase?.()] || "white";

  box.style.cssText =
    baseStyle +
    boxShadowStyle +
    `
      background-image: ${
        blook.backgroundUrl
          ? `url(${blook.backgroundUrl})`
          : "radial-gradient(circle, #6f057a, #4a034f)"
      };
    `;

  box.innerHTML = `
    <h1 style="font-size:24px;font-weight:bold;font-family: 'DaydreamWeb';">${blook.blookName}</h1>
    <p style="color:${color};font-size:26px;font-weight:bold;">
      ${capitalize(rarity)}
    </p>
    <img src="${blook.imageUrl}" style="width:165px;height:170px;object-fit:contain;filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.71));">
    <p style="font-size:30px;font-weight:bold;">${blook.chance}%</p>
    ${(adjustedChance !== null) ? `<p style="font-size:18px;opacity:0.95;margin-top:-6px;">Boosted chance: ${adjustedChance}%</p>` : ``}

  `;


  overlay.appendChild(box);
  document.body.appendChild(overlay);

  let particleParent = document.getElementById("phaser-particle-parent");
  if (!particleParent) {
    particleParent = document.createElement("div");
    particleParent.id = "phaser-particle-parent";
    particleParent.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
    `;
    document.body.appendChild(particleParent);
  }

  triggerRaritySpecificParticles(rarity);

  if (!skipIntro) {
    await playRarityIntro(box, rarity);
  } else {
    box.style.opacity = "1";
    box.style.transform = "translate(-50%, -50%)";
  }

  requestAnimationFrame(() => {
    void box.offsetHeight; 

    if (rarity === "Chroma" || rarity === "Mystical") {
      Object.assign(box.style, {
        position: "absolute", top: "50%", left: "50%",
        width: "370px", height: "385px", opacity: "0"
      });
      box.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.2) rotate(0deg)" },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1.0) rotate(2160deg)" }
        ],
        { duration: 5000, easing: "linear", fill: "forwards" }
      );
      return;
    }

    if (rarity === "Rare") {
      box.animate(
        [
          { opacity: 0, transform: baseCenter + " scale(0.5) rotate(-10deg)" },
          { opacity: 1, transform: baseCenter + " scale(1.2) rotate(5deg)" },
          { transform: baseCenter + " scale(0.95) rotate(-2deg)" },
          { transform: baseCenter + " scale(1.0) rotate(0deg)" }
        ],
        { duration: 600, easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", fill: "both" }
      );
      return;
    }

    if (rarity === "Legendary") {
      box.animate(
        [
          { opacity: 0, transform: "translate(-50%, -1000px)" },
          
          { opacity: 1, transform: "translate(-50%, -50%)" }
        ],
        {
          duration: 3500, 
          easing: "linear", 
          fill: "both"
        }
      );
      return;
    }

    if (rarity === "Epic") {
      box.animate(
        [
          { opacity: 0, transform: baseCenter + " scale(0.5) rotate(-10deg)" },
          { opacity: 1, transform: baseCenter + " scale(1.2) rotate(5deg)" },
          { transform: baseCenter + " scale(0.95) rotate(-2deg)" },
          { transform: baseCenter + " scale(1.0) rotate(0deg)" }
        ],
        { duration: 600, easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", fill: "both" }
      );
      return;
    }

    if (rarity === "Uncommon") {
      box.animate(
        [
          { opacity: 0, transform: baseCenter + " scale(0.9) translateY(20px)" },
          { opacity: 1, transform: baseCenter + " scale(1.05) translateY(-5px)" },
          { transform: baseCenter + " scale(1.0) translateY(0px)" }
        ],
        { duration: 500, easing: "cubic-bezier(0.2, 0.9, 0.2, 1)", fill: "both" }
      );
      return;
    }

    box.animate(
      [
        { opacity: 0.2, transform: baseCenter + " scale(0.98)" },
        { opacity: 1, transform: baseCenter + " scale(1)" }
      ],
      { duration: 220, easing: "cubic-bezier(0.2, 0.9, 0.2, 1)", fill: "both" }
    );
  });


  overlay.onclick = () => {
    overlay.remove();
    document.getElementById("phaser-particle-parent")?.remove();

    if (phaserGame) {
      phaserGame.destroy(true);
      phaserGame = null;
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const instantOpenElement = document.getElementById("instantOpen");

  if (!instantOpenElement) return;


  let instantOpen = localStorage.getItem("instantOpen") === "On";

  function updateText() {
    instantOpenElement.textContent =
      `Instant Open: ${instantOpen ? "On" : "Off"}`;
  }

  updateText();

  instantOpenElement.addEventListener("click", () => {
    instantOpen = !instantOpen;

    localStorage.setItem(
      "instantOpen",
      instantOpen ? "On" : "Off"
    );

    updateText();
  });
});

let __autoOpenInFlight = false;

function openAutoOpenerModal() {
  const existing = document.getElementById("auto-opener-modal");
  existing?.remove();

  const STORAGE = {
    running: "autoOpenerRunning",
    pack: "autoOpenerPack",
    interval: "autoOpenerIntervalMs",
    max: "autoOpenerMaxOpens",
  };

  const savedRunning = localStorage.getItem(STORAGE.running) === "On";
  const savedPack = localStorage.getItem(STORAGE.pack) || "";
  const savedInterval = Number(localStorage.getItem(STORAGE.interval) || "1200");
  const savedMax = Number(localStorage.getItem(STORAGE.max) || "10");

  const overlay = document.createElement("div");
  overlay.id = "auto-opener-modal";
  overlay.className = "sell-blook-modal-overlay";

  const box = document.createElement("div");
  box.className = "sell-blook-modal-box";

  box.innerHTML = `
    <h3 class="sell-blook-modal-title">Auto Opener</h3>

    <div class="sell-blook-modal-subtitle" id="autoOpenStatus">Off</div>

    <div class="sell-blook-modal-input-row" style="flex-direction: column; align-items: stretch;">
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top: 10px;">
        <label class="sell-blook-modal-label">Pack</label>
        <select id="autoOpenPackSelect" class="sell-blook-modal-amount" style="width: 220px; height: 42px;"></select>
      </div>

      <div style="display:flex; gap:12px; justify-content:center; align-items:center; flex-wrap:wrap; margin-top: 12px;">
        <label class="sell-blook-modal-label">Interval (ms)</label>
        <input id="autoOpenIntervalInput" class="sell-blook-modal-amount" type="number" min="200" step="100" value="${Number.isFinite(savedInterval) ? savedInterval : 1200}" />
      </div>

      <div style="display:flex; gap:12px; justify-content:center; align-items:center; flex-wrap:wrap; margin-top: 12px;">
        <label class="sell-blook-modal-label">Max opens</label>
        <input id="autoOpenMaxOpensInput" class="sell-blook-modal-amount" type="number" min="1" step="1" value="${Number.isFinite(savedMax) ? savedMax : 10}" />
      </div>
    </div>

    <div class="sell-blook-modal-actions">
      <button type="button" id="autoOpenToggle" class="sell-blook-modal-btn sell-blook-modal-btn-primary">Start</button>
      <button type="button" id="autoOpenCancel" class="sell-blook-modal-btn sell-blook-modal-btn-secondary">Cancel</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const toggleEl = overlay.querySelector("#autoOpenToggle");
  const packSelectEl = overlay.querySelector("#autoOpenPackSelect");

  if (toggleEl) {
    toggleEl.textContent = savedRunning ? "Stop" : "Start";
  }

  const intervalInputEl = overlay.querySelector("#autoOpenIntervalInput");
  const maxOpensInputEl = overlay.querySelector("#autoOpenMaxOpensInput");
  const statusEl = overlay.querySelector("#autoOpenStatus");
  const cancelBtn = overlay.querySelector("#autoOpenCancel");

  const close = () => overlay.remove();

  cancelBtn.onclick = close;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") close();
    },
    { once: true }
  );

  function setStatus(text) {
    statusEl.textContent = text;
  }

  async function getPackCostByName(name) {
    if (!window.__autoOpenPacksCache) {
      const res = await fetch("/api/packs");
      if (!res.ok) return null;
      window.__autoOpenPacksCache = await res.json();
    }
    const packs = window.__autoOpenPacksCache || [];
    return packs.find((p) => p?.name === name)?.cost ?? null;
  }

  async function refreshPackOptions() {
    const packs = window.__autoOpenPacksCache || (await (await fetch("/api/packs")).json());
    window.__autoOpenPacksCache = packs;

    packSelectEl.innerHTML = (packs || [])
      .map((p) => `<option value="${p.name}">${p.name}</option>`)
      .join("");

    if (savedPack && (packs || []).some((p) => p?.name === savedPack)) {
      packSelectEl.value = savedPack;
    } else if ((packs || [])[0]?.name) {
      packSelectEl.value = packs[0].name;
    }
  }

  async function startAutoOpener() {
    if (__autoOpenInFlight) return;
    if (!packSelectEl.value) {
      setStatus("Select a pack");
      return;
    }

    const packName = packSelectEl.value;
    const intervalMs = Math.max(200, Number(intervalInputEl.value || "1200"));
    const maxOpens = Math.max(1, Number(maxOpensInputEl.value || "10"));

    localStorage.setItem(STORAGE.pack, packName);
    localStorage.setItem(STORAGE.interval, String(intervalMs));
    localStorage.setItem(STORAGE.max, String(maxOpens));

    window.__autoOpenRunning = true;
    localStorage.setItem(STORAGE.running, "On");

    toggleEl.textContent = "Stop";
    setStatus(`Running • 0/${maxOpens}`);
    __autoOpenInFlight = true;

    try {
      let openedCount = 0;
      while (window.__autoOpenRunning && openedCount < maxOpens) {
        const packCost = await getPackCostByName(packName);
        if (packCost === null) {
          setStatus("Error: can't load pack cost");
          break;
        }

        if (userTokens < packCost) {
          setStatus("Stopped (not enough tokens)");
          break;
        }

        let response;
        try {
          response = await fetch(`/api/packs/open/${encodeURIComponent(packName)}`, {
            method: "POST",
            credentials: "include",
          });
        } catch (err) {
          console.error("Network error:", err);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        if (response.status === 429) {
          setStatus("Rate limited • cooldown...");
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        if (response.status === 401) {
          setStatus("Not logged in • retry...");
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          console.log("Server error:", data?.error || "Unknown error");
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        userTokens = data.tokens;
        updateTokens();

        openedCount += 1;
        setStatus(`Running • ${openedCount}/${maxOpens}`);

        const packBg = (window.__autoOpenPacksCache || []).find((p) => p?.name === packName)?.packBackground || "";
        showResult(data.blook, {
          packBackground: packBg,
          phase: "reveal",
          revealDelayMs: 0,
          skipIntro: true,
        });

        await new Promise((r) => setTimeout(r, intervalMs));
      }
    } catch (err) {
      console.error("Auto opener unexpected error:", err);
      setStatus("Auto opener error");
    } finally {
      window.__autoOpenRunning = false;
      localStorage.setItem(STORAGE.running, "Off");
      toggleEl.textContent = "Start";
      __autoOpenInFlight = false;
    }
  }

  function stopAutoOpener() {
    window.__autoOpenRunning = false;
    localStorage.setItem(STORAGE.running, "Off");
    toggleEl.textContent = "Start";
    setStatus("Stopped");
  }

  toggleEl.onclick = async () => {
    if (window.__autoOpenRunning) {
      stopAutoOpener();
      return;
    }

    if (__autoOpenInFlight) return;

    close();
    await refreshPackOptions();
    await startAutoOpener();
  };

  intervalInputEl.addEventListener("change", () => {
    localStorage.setItem(STORAGE.interval, intervalInputEl.value);
  });

  maxOpensInputEl.addEventListener("change", () => {
    localStorage.setItem(STORAGE.max, maxOpensInputEl.value);
  });

  packSelectEl.addEventListener("change", () => {
    localStorage.setItem(STORAGE.pack, packSelectEl.value);
  });

  refreshPackOptions()
    .then(() => {
      setStatus(savedRunning ? "Running..." : "Off");
    })
    .catch(() => setStatus("Error loading packs"));
}

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("autoOpenMenuBtn");
  if (!menuBtn) return;

  menuBtn.addEventListener("click", () => {
    openAutoOpenerModal();
  });
});