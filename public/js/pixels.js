let allPacks = [];
let selectedBlook = null;
let allBlooksFlat = [];

const container = document.querySelector(".pixelsContainer");
const detailsPanel = document.querySelector(".blooks-details");

const RARITY_COLORS = {
  common: "#ffffff",
  uncommon: "#4bc22e",
  rare: "#2f6cff",
  epic: "#be0000",
  legendary: "#ff910f",
  chroma: "#00ccff",
  mystical: "#9935dd"
};

const RARITY_VALUES = {
  uncommon: 5,
  rare: 20,
  epic: 75,
  legendary: 200,
  chroma: 300,
  mystical: 1000
};

async function loadBlooks() {
  try {
    const res = await fetch("/api/userBlooks", {
      credentials: "include"
    });

    const text = await res.text();

    const data = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return { error: "Non-JSON response", raw: text.slice(0, 300) };
      }
    })();

    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      throw new Error(data.error || "Request failed");
    }

    allPacks = data.packs || [];
    generatePacksHTML(allPacks);

  } catch (err) {
    console.error("loadBlooks error:", err);
  }
}

function generatePacksHTML(packsData) {
  if (!container) return;

  container.innerHTML = `
    <div class="search-wrapper">
      <input
        type="text"
        id="blookSearch"
        class="blook-search"
        placeholder="Search Blooks"
      />
    </div>
  `;

  allBlooksFlat = [];

  if (!packsData || !packsData.length) {
    container.innerHTML += ``;
    return;
  }

  const sortedPacks = [...packsData].sort((a, b) =>
    (a?.name || "").toLowerCase().localeCompare((b?.name || "").toLowerCase())
  );

  sortedPacks.forEach((pack) => {
    const packDiv = document.createElement("div");
    packDiv.className = "pack";

    const packTitle = document.createElement("h2");
    packTitle.className = "pack-title";
    packTitle.textContent = pack.name;
    packDiv.appendChild(packTitle);

    const itemsDiv = document.createElement("div");
    itemsDiv.className = "items";

    const blooks = Array.isArray(pack.blooks) ? pack.blooks : [];

    allBlooksFlat.push(...blooks);

    const sortedBlooks = [...blooks].sort((a, b) => {
      const rarityOrder = {
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
        chroma: 5,
        mystical: 6
      };

      const aR = rarityOrder[(a?.rarity || "").toLowerCase()] || 999;
      const bR = rarityOrder[(b?.rarity || "").toLowerCase()] || 999;

      if (aR !== bR) return aR - bR;

      const aOwned = Number(a?.owned ?? 0);
      const bOwned = Number(b?.owned ?? 0);

      if (bOwned !== aOwned) return bOwned - aOwned;

      return (a?.name || "").localeCompare(b?.name || "");
    });

    sortedBlooks.forEach((blook) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "item";
      itemDiv.dataset.name = (blook.name || "").toLowerCase();

      if (blook.owned > 0) {
        const img = document.createElement("img");
        img.className = "blook-image";
        img.src = blook.imageUrl || "";
        img.alt = blook.name;

        itemDiv.appendChild(img);

        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = blook.owned;

        badge.style.backgroundColor =
          RARITY_COLORS[(blook.rarity || "").toLowerCase()] || "purple";

        itemDiv.appendChild(badge);

        itemDiv.onclick = () => updateBlookInfo(blook);
      } else {
        itemDiv.classList.add("locked-item");

        const lockIcon = document.createElement("img");
        lockIcon.className = "lock-icon";
        lockIcon.src =
          "https://izumiihd.github.io/pixelitcdn/assets/img/icons/lock.png";
        lockIcon.alt = "Locked";

        itemDiv.appendChild(lockIcon);
      }

      itemsDiv.appendChild(itemDiv);
    });

    packDiv.appendChild(itemsDiv);
    container.appendChild(packDiv);
  });
}

document.addEventListener("input", (e) => {
  if (e.target.id !== "blookSearch") return;

  const value = e.target.value.toLowerCase();

  document.querySelectorAll(".item").forEach((item) => {
    const name = item.dataset.name || "";
    item.style.display = name.includes(value) ? "flex" : "none";
  });
});

function updateBlookInfo(blook) {
  selectedBlook = blook;

  const detailsPanel = document.querySelector(".blooks-details");

  document.getElementById("blookName").innerText = blook.name;

  const rarityColor =
    RARITY_COLORS[(blook.rarity || "").toLowerCase()] || "white";

  document.getElementById("blookRarity").innerHTML = `
    <span style="
      color:${rarityColor};
      text-shadow:-1px -1px 0 black,1px -1px 0 black,-1px 1px 0 black,1px 1px 0 black;
    ">
      ${blook.rarity}
    </span>
  `;

  document.getElementById("blookImage").src = blook.imageUrl;
  document.getElementById("amountOwned").innerText = `${blook.owned} Owned`;

  if (detailsPanel) {
    const bg = blook.backgroundUrl;

    if (typeof bg === "string" && bg.length > 5) {
      detailsPanel.style.backgroundImage = `url("${bg}")`;
      detailsPanel.style.backgroundSize = "cover";
      detailsPanel.style.backgroundPosition = "center";
      detailsPanel.style.backgroundRepeat = "no-repeat";
      detailsPanel.style.boxShadow = `
        inset 0 0 80px rgba(0,0,0,0.55),
        inset 0 0 140px rgba(0,0,0,0.35),
        inset 0 -6px rgba(0,0,0,0.4),
        3px 3px 15px rgba(0,0,0,0.6)
      `;
    } else {
      detailsPanel.style.backgroundImage = "none";
    }
  } else {
    console.error(err);
  }
}

function sellBlook() {
  const blookName = document.getElementById("blookName").textContent;
  const ownedEl = document.getElementById("amountOwned");

  const owned = parseInt(ownedEl.textContent.split(" ")[0], 10);

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: #00000000;
    display:flex;
    justify-content:center;
    align-items:center;
    z-index:9999;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: #5e046e;
    box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);
    padding:20px;
    width:400px;
    text-align:center;
    color:white;
    border-radius:8px;
  `;

  const text = document.createElement("p");
  text.textContent = `Sell ${blookName}?`;
  box.appendChild(text);

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.max = owned;
  input.value = "1";
  input.style.cssText = "font-size:20px;width:80px;text-align:center;";

  const wrap = document.createElement("div");
  wrap.style.margin = "10px";
  wrap.appendChild(input);
  box.appendChild(wrap);

  const error = document.createElement("div");
  error.style.color = "red";
  box.appendChild(error);

  const sellBtn = document.createElement("button");
  sellBtn.textContent = "Sell";
  sellBtn.style.margin = "10px";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";

  box.appendChild(sellBtn);
  box.appendChild(cancelBtn);
  modal.appendChild(box);
  document.body.appendChild(modal);

  sellBtn.onclick = async () => {
    const quantity = parseInt(input.value, 10);

    if (!quantity || quantity < 1 || quantity > owned) {
      error.textContent = "Invalid amount";
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const res = await fetch("/api/users/sell-blook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          blookName,
          quantity
        })
      });

      const data = await res.json();

      if (!data.success) {
        error.textContent = data.error;
        return;
      }

      ownedEl.textContent = `${owned - quantity} Owned`;

      document.body.removeChild(modal);

    } catch (err) {
      console.error(err);
      error.textContent = "Server error";
    }
  };

  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".sellBtn").addEventListener("click", sellBlook);
});

document.addEventListener("DOMContentLoaded", () => {
  loadBlooks();
});