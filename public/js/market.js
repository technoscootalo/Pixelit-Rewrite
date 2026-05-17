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
  try {
    const instantOpen = localStorage.getItem("instantOpen") === "On";

    if (userTokens < pack.cost) {
      showModal("Not enough tokens!");
      return;
    }

    if (!instantOpen) {
      const confirmed = await confirmPurchase(pack);

      if (!confirmed) {
        return;
      }
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
      throw new Error(data.error || "Failed to open pack");
    }

    userTokens = data.tokens;
    updateTokens();

    showResult(data.blook, {
      packBackground: pack.packBackground
    });

  } catch (err) {
    console.error(err);
    showModal(err.message || "Something went wrong");
  }
}

function showResult(blook, pack = null) {
  const overlay = document.createElement("div");

  const packBg = pack?.packBackground || "";

  // packBackground can be:
  // a plain color (e.g. #6ea2ca)
  // a CSS gradient (linear-gradient(...), radial-gradient(...))
  // an image url stored in Mongo
  // we detect URL-ish strings and apply as background-image: url(...);
  // otherwise we treat it as a raw CSS background string.
  const isImageUrl = (value) => {
    if (!value) return false;
    const v = String(value).trim();
    return /^(https?:\/\/|\/|data:image\/)/i.test(v);
  };

  const overlayBg = packBg
    ? (isImageUrl(packBg) ? `url(${packBg})` : packBg)
    : "radial-gradient(circle, rgb(51, 8, 56), rgb(74, 3, 79))";

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:999;
    background-image: ${overlayBg};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  `;


  const box = document.createElement("div");

  const rarity = blook.rarity || "unknown";
  const color = rarityColors[rarity.toLowerCase()] || "white";

  const bg = blook.backgroundUrl || "";

  box.style.cssText = `
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:370px;
    height:385px;
    border-radius:10px;
    text-align:center;
    color:white;
    padding:20px;
    background-image: ${bg ? `url(${bg})` : 'radial-gradient(circle, #6f057a, #4a034f)'};
    background-size: cover;
    cursor: pointer;
    background-position: center;
    box-shadow: rgb(162 140 140 / 55%) 0px 0px 80px inset, rgb(255 255 255 / 35%) 0px 0px 140px inset, rgb(145 137 137 / 40%) 0px -6px inset, rgb(125 120 120 / 60%) 3px 3px 15px
  `;

  box.innerHTML = `
    <h1 style=font-weight:bold;font-size: 34px; text-shadow: -1px -1px 0 black,1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black; " >${blook.blookName}</h1>
    <p style="color:${color}; font-weight:bold; font-size: 20px; text-shadow: -1px -1px 0 black,
    1px -1px 0 black,
    -1px 1px 0 black,
    1px 1px 0 black; ">
      ${capitalize(rarity)}
    </p>
    <img src="${blook.imageUrl}" style="width:165px;height:170px;filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5)); object-fit:contain;">
    <p style="font-size:30px; font-weight:bold;">${blook.chance}%</p>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.onclick = () => overlay.remove();
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