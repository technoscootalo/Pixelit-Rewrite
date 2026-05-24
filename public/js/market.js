let userTokens = 0;
let userRole = null;

let phaserGame = null;

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
        "https://media.blooket.com/image/upload/v1658790246/Media/market/particles/square_turquoise.svg",
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

document.addEventListener("DOMContentLoaded", () => {
  fetchUser();
  initWeeklyCountdown();
  fetchWeeklyBlooks();
  fetchPacks();
});

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

async function initWeeklyCountdown() {
  try {
    const el = document.getElementById("weeklyCountdownText");
    if (!el) return;

    const res = await fetch("/api/weekly/market", { method: "GET" });
    const text = await res.text();

    if (!res.ok) {
      console.error("Failed to load weekly window:", text);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse weekly window JSON:", text);
      return;
    }

    const weekEndsAt = new Date(data.weekEndsAt);


    const tick = () => {
      const remaining = weekEndsAt.getTime() - Date.now();
      el.textContent = formatRemaining(remaining);
    };

    tick();
    setInterval(tick, 1000);
  } catch (err) {
    console.error(err);
  }
}

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

function displayPacks(packs) {
  const container = document.getElementById("packContainer");
  if (!container) return;

  container.innerHTML = "";

  packs.forEach(pack => {
    container.appendChild(createPack(pack));
  });
}

function createWeeklyBlookCard(blook) {
  const card = document.createElement("div");
  card.className = "weeklyBlookCard";
  card.setAttribute("data-blook-id", String(blook.blookId || ""));

  card.innerHTML = `
    <img class="weeklyBlookImage" src="${blook.imageUrl || ""}" alt="${blook.BlookName || ""}" />
    <div class="weeklyBlookName">${blook.BlookName || ""}</div>
    <div class="weeklyBlookCost">
      <img
        src="https://izumiihd.github.io/pixelitcdn/assets/img/icons/token.png"
        style="width:20px;height:20px;filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));"
      />
      <span>${blook.cost ?? 0}</span>
    </div>
    /*<button class="weeklyBuyBtn" type="button">Buy</button>*/
  `;

  const btn = card.querySelector(".weeklyBuyBtn");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    buyWeeklyBlook(blook.blookId);
  });

  return card;
}

/*async function fetchWeeklyBlooks() {
  try {
    const res = await fetch("/api/weekly/blooks", { method: "GET" });
    const text = await res.text();
    if (!res.ok) {
      console.error("Failed to load weekly blooks:", text);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { blooks: [] };
    }

    const container = document.getElementById("weeklyBlookContainer");
    if (!container) return;

    container.innerHTML = "";
    const blooks = Array.isArray(data?.blooks) ? data.blooks : [];
    blooks.forEach(b => container.appendChild(createWeeklyBlookCard(b)));
  } catch (err) {
    console.error(err);
  }
}*/

/*async function buyWeeklyBlook(blookId) {
  if (!blookId) return;
  if (typeof window.showLoader === "function") window.showLoader();

  try {
    if (userTokens <= 0) {
      showModal("Not enough tokens!");
      return;
    }

    const res = await fetch(`/api/weekly/blooks/buy/${encodeURIComponent(blookId)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (res.status === 401) {
      showModal("Not logged in", true);
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showModal(data?.error || "Failed to buy");
      return;
    }

    userTokens = data.tokens;
    updateTokens();

    if (typeof data?.blook) {
      showResult(data.blook, { phase: "reveal", skipIntro: true });
    }
  } catch (err) {
    console.error(err);
    showModal(err.message || "Something went wrong");
  } finally {
    if (typeof window.hideLoader === "function") window.hideLoader();
  }
}*/

function createPack(pack) {
  const div = document.createElement("div");
  div.className = "box";
  div.setAttribute("data-pack-name", pack.name);

  if (pack.name === "OG Pack") {
    div.style.background = "radial-gradient(circle, #ADD8E6, #335494)";
    div.style.boxShadow = "inset 0 -0.365vw #335494, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Color Pack") {
    div.style.background = "radial-gradient(circle, #FFFF00, #8B8000)";
    div.style.boxShadow = "inset 0 -0.365vw #8B8000, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Fall Pack") {
    div.style.background = "radial-gradient(circle, #DEB887, #8B4513)";
    div.style.boxShadow = "inset 0 -0.365vw #8B4513, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Halloween Pack") {
    div.style.background = "radial-gradient(circle, #39272d, #67433e)";
    div.style.boxShadow = "inset 0 -0.365vw #39272d, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Christmas Pack") {
    div.style.background = "radial-gradient(circle, rgb(46, 139, 87), rgb(30, 86, 49), rgb(12, 45, 28), rgb(5, 20, 11))";
    div.style.boxShadow = "inset 0 -0.365vw rgba(13, 115, 45, 0.17), 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Space Pack") {
    div.style.background = "radial-gradient(circle, #808080, #00008B)";
    div.style.boxShadow = "inset 0 -0.365vw #00008B, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Technology Pack") {
    div.style.background = "radial-gradient(circle, #346136, #2faa34)";
    div.style.boxShadow = "inset 0 -0.365vw #346136, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "School Pack") {
    div.style.background = "radial-gradient(circle, #836048, #66423a)";
    div.style.boxShadow = "inset 0 -0.365vw #66423a, 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }

  if (pack.name === "Miscellaneous") {
    div.style.background = "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)";
    div.style.boxShadow = "inset 0 -0.365vw rgba(0, 0, 0, 0.6), 3px 3px 15px rgba(0, 0, 0, 0.6)";
  }


  const img = document.createElement("img");

  img.src = pack.packImageUrl;
  img.alt = pack.name;

  img.style.cssText = `
    width:145px;
    height:145px;
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

  const cost = document.createElement("p");
  cost.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: white;
    font-weight: bold;
    font-size: 32px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  `;

  cost.innerHTML = `
    <img 
      src="https://izumiihd.github.io/pixelitcdn/assets/img/icons/token.png"
      style="
        width:28px;
        height:28px;
        filter: drop-shadow(0 0 5px rgba(0,0,0,0.5));
      "
    >
    ${pack.cost}
  `;

  div.appendChild(img);
  div.appendChild(document.createElement("br"));
  div.appendChild(cost);

  div.onclick = () => openPack(pack, img);

  img.onclick = (e) => {
    e.stopPropagation();
    openPack(pack, img);
  };

  return div;
}

function confirmPurchase(pack) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 99999;
    `;

    const modalBox = document.createElement("div");

    modalBox.style.cssText = `
      padding: 25px;
      width: 400px;
      border-radius: 5px;
      text-align: center;
      color: white;
      font-family: Pixelify Sans;
      background: #5e046e;
      box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.4);
    `;

    modalBox.innerHTML = `
      <p style="font-size:35px;">
        Purchase <strong>${pack.name}</strong>
        for <span>${pack.cost}</span> tokens?
      </p>

      <div style="
        display:flex;
        justify-content:center;
        gap:15px;
        margin-top:20px;
      ">
        <button id="purchaseYes">Yes</button>
        <button id="purchaseNo">No</button>
      </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    const yesBtn = modalBox.querySelector("#purchaseYes");
    const noBtn = modalBox.querySelector("#purchaseNo");

    yesBtn.style.cssText = `
      background: #5e046e;
      box-shadow: inset 0 -0.265vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.4);
      font-family: 'Pixelify Sans', sans-serif;
      color: white;
      border: none;
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 8px;
      cursor: pointer;
    `;

    noBtn.style.cssText = `
      background: #5e046e;
      box-shadow: inset 0 -0.265vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.4);
      font-family: 'Pixelify Sans', sans-serif;
      color: white;
      border: none;
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 8px;
      cursor: pointer;
    `;

    yesBtn.onclick = () => {
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

async function openPack(pack) {
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
      credentials: "include"
    });

    if (res.status === 401) {
      showModal("Not logged in", true);
      return;
    }

    const data = await res.json();

if (!res.ok) {
      const errMsg = data?.error || "Failed to open pack";
      showModal(errMsg);
      if (typeof window.hideLoader === "function") window.hideLoader();
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

    if (typeof window.hideLoader === "function") window.hideLoader();


  } catch (err) {
    console.error(err);
    showModal(err.message || "Something went wrong");
    if (typeof window.hideLoader === "function") window.hideLoader();
  }
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function animateBox(box, keyframes, options) {
  return box.animate(keyframes, options).finished;
}

async function playRarityIntro(box, rarity) {
  const center = "translate(-50%, -50%)";

  box.style.transition = "none";
  box.style.opacity = "0";
  box.style.transform = center;

  const reveal = () => {
    box.style.transition = "opacity 250ms ease";
    box.style.opacity = "1";
  };

  const isLow =
    !rarity ||
    rarity === "Common" ||
    rarity === "Uncommon" ||
    rarity === "Rare";

  if (isLow) {
    await sleep(500);
    reveal();

    box.style.transition = "transform 250ms cubic-bezier(0.2, 0.9, 0.2, 1)";
    box.style.transform = center + " translateY(30px) scale(0.9)";

    await sleep(250);

    box.style.transition = "transform 350ms cubic-bezier(0.2, 1.2, 0.2, 1)";
    box.style.transform = center + " translateY(-10px) scale(1.08)";

    await sleep(350);

    box.style.transition = "transform 250ms ease-out";
    box.style.transform = center + " translateY(0px) scale(1)";

    await sleep(250);

    return;
  }

  if (rarity === "Epic") {
    await sleep(650);
    reveal();

    box.style.transform = center + " scale(0.6) translateY(20px)";

    await animateBox(box, [
      {
        transform: center + " scale(0.6) translateY(20px)"
      },
      {
        transform: center + " scale(1.15) translateY(-10px)"
      }
    ], {
      duration: 350,
      easing: "cubic-bezier(0.2, 0.9, 0.2, 1)"
    });

    await animateBox(box, [
      {
        transform: center + " scale(1.15)"
      },
      {
        transform: center + " scale(0.98)"
      }
    ], {
      duration: 180,
      easing: "ease-out"
    });

    await animateBox(box, [
      {
        transform: center + " scale(0.98)"
      },
      {
        transform: center + " scale(1)"
      }
    ], {
      duration: 180,
      easing: "ease-out"
    });

    return;
  }

  if (rarity === "Chroma" || rarity === "Mystical") {
    await sleep(1200);
    reveal();

    box.style.transform = center + " scale(0.3) rotate(0deg)";

    await animateBox(box, [
      {
        transform: center + " scale(0.3) rotate(0deg)"
      },
      {
        transform: center + " scale(1.05) rotate(1080deg)"
      }
    ], {
      duration: 2500,
      easing: "linear"
    });

    box.style.transition = "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    box.style.transform = center + " scale(1) rotate(0deg)";

    await sleep(500);
    box.style.transition = "none";

    return;
  }

  if (rarity === "Legendary") {
    await sleep(1500);
    reveal();

    await animateBox(box, [
      { transform: "translate(-160%, -200%)" },
      { transform: "translate(-160%, -50%)" }
    ], { duration: 900, easing: "ease-in" });

    await animateBox(box, [
      { transform: "translate(160%, -200%)" },
      { transform: "translate(160%, -50%)" }
    ], { duration: 900, easing: "ease-in" });

    await animateBox(box, [
      { transform: "translate(-50%, -140%) scale(1.15)" },
      { transform: center }
    ], { duration: 900, easing: "ease-out" });

    await sleep(600);
    return;
  }

  await sleep(500);
  reveal();

  box.style.transition = "transform 400ms ease";
  box.style.transform = center;
  await sleep(400);
}

async function showResult(blook, pack = null) {
  const overlay = document.createElement("div");
  const skipIntro = !!pack?.skipIntro;

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
    z-index: 999;
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
    <h1 style="font-size:34px;font-weight:bold;">${blook.blookName}</h1>
    <p style="color:${color};font-size:26px;font-weight:bold;">
      ${capitalize(rarity)}
    </p>
    <img src="${blook.imageUrl}" style="width:165px;height:170px;object-fit:contain;">
    <p style="font-size:30px;font-weight:bold;">${blook.chance}%</p>
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

if (typeof window.showLoader === "function") window.showLoader();

if (typeof window.hideLoader === "function") window.hideLoader();
