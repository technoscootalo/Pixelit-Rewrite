let allpacks = [];
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

  const sortedPacksWithMiscLast = sortedPacks.slice().sort((a, b) => {
    const aMisc = a?.name === "Miscellaneous";
    const bMisc = b?.name === "Miscellaneous";
    if (aMisc && !bMisc) return 1;
    if (!aMisc && bMisc) return -1;
    return 0;
  });

  sortedPacksWithMiscLast.forEach((pack) => {
    const packDiv = document.createElement("div");
    packDiv.className = "pack";

    const packTitle = document.createElement("h2");
    packTitle.className = "pack-title";
    packTitle.textContent = pack.name;

    if (pack.name === "Miscellaneous") {
      packTitle.style.color = "#ffe66d";
    }

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
        img.src = blook.imageUrl || "https://github.io";
        img.alt = blook.name;

        itemDiv.appendChild(img);

        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = Number(blook.owned).toLocaleString(); 

        badge.style.backgroundColor =
          RARITY_COLORS[(blook.rarity || "").toLowerCase()] || "white";

        itemDiv.appendChild(badge);

        itemDiv.style.transition = "transform 0.2s ease-in-out";

        itemDiv.addEventListener("mouseover", () => {
          itemDiv.style.transform = "scale(0.9)";
        });

        itemDiv.addEventListener("mouseout", () => {
          itemDiv.style.transform = "scale(1)";
        });

        itemDiv.addEventListener("mousedown", () => {
          itemDiv.style.transform = "scale(0.8)";
        });

        itemDiv.addEventListener("mouseup", () => {
          itemDiv.style.transform = "scale(1)";
        });

        itemDiv.onclick = () => updateBlookInfo(blook);
      } else {
        itemDiv.classList.add("locked-item");

        const img = document.createElement("img");
        img.className = "blook-image locked-blook-image";
        img.src = blook.imageUrl || "https://github.com/IzumiiHD/pixelitcdn/blob/main/assets/img/blooks/placeholder.png";
        img.alt = blook.name;
        itemDiv.appendChild(img);

        const lockIcon = document.createElement("img");
        lockIcon.className = "custom-lock-icon";
        lockIcon.src = "https://github.com/IzumiiHD/pixelitcdn/blob/main/assets/img/icons/lock.png?raw=true";
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

  const existing = document.getElementById("sell-blook-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "sell-blook-modal";
  modal.className = "sell-blook-modal-overlay";

  const box = document.createElement("div");
  box.className = "sell-blook-modal-box";

  const title = document.createElement("h3");
  title.className = "sell-blook-modal-title";
  title.textContent = `Sell ${blookName}?`;

  const subtitle = document.createElement("div");
  subtitle.className = "sell-blook-modal-subtitle";
  subtitle.textContent = `${owned} Owned`;

  const inputRow = document.createElement("div");
  inputRow.className = "sell-blook-modal-input-row";

  const label = document.createElement("label");
  label.className = "sell-blook-modal-label";
  label.textContent = "Amount";

  const input = document.createElement("input");
  input.className = "sell-blook-modal-amount";
  input.type = "number";
  input.min = "1";
  input.max = String(owned);
  input.value = "1";

  inputRow.appendChild(label);
  inputRow.appendChild(input);

  const error = document.createElement("div");
  error.className = "sell-blook-modal-error";

  const actions = document.createElement("div");
  actions.className = "sell-blook-modal-actions";

  const sellBtn = document.createElement("button");
  sellBtn.type = "button";
  sellBtn.className = "sell-blook-modal-btn sell-blook-modal-btn-primary";
  sellBtn.textContent = "Sell";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "sell-blook-modal-btn sell-blook-modal-btn-secondary";
  cancelBtn.textContent = "Cancel";

  actions.appendChild(sellBtn);
  actions.appendChild(cancelBtn);

  box.appendChild(title);
  box.appendChild(subtitle);
  box.appendChild(inputRow);
  box.appendChild(error);
  box.appendChild(actions);

  modal.appendChild(box);
  document.body.appendChild(modal);

  const close = () => modal.remove();

  cancelBtn.onclick = close;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") close();
    },
    { once: true }
  );

  sellBtn.onclick = async () => {
    const quantity = parseInt(input.value, 10);

    if (!quantity || quantity < 1 || quantity > owned) {
      error.textContent = "Invalid amount";
      return;
    }

    if (typeof window.showLoader === "function") window.showLoader();

    try {
      const logged = await fetch("/api/loggedin", { credentials: "include" });
      const loggedData = await logged.json();
      if (!logged.ok || !loggedData.loggedIn || !loggedData.user?.id) {
        error.textContent = "Not logged in";
        return;
      }

      const userId = loggedData.user.id;

      sellBtn.disabled = true;
      cancelBtn.disabled = true;
      error.textContent = "";

      const res = await fetch("/api/users/sell-blook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: userId,
          blookName,
          quantity
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        error.textContent = data?.error || "Failed to sell blook";
        return;
      }

      await loadBlooks();

      const amtEl = document.getElementById("amountOwned");
      if (amtEl && selectedBlook?.name) {
        const fresh = allBlooksFlat.find(
          (b) => (b?.name || "") === selectedBlook.name
        );

        const updated = Number(fresh?.owned ?? fresh?.owned?.amount ?? 0);

        amtEl.textContent = `${updated} Owned`;
        selectedBlook.owned = updated;
      }


      close();



    } catch (err) {
      console.error(err);
      error.textContent = "Server error";
    } finally {
      if (typeof window.hideLoader === "function") window.hideLoader();
      sellBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const sellBtnEl = document.querySelector(".sellBtn");
  if (sellBtnEl) sellBtnEl.addEventListener("click", sellBlook);

  const giftBtnEl = document.querySelector(".giftBtn");
  if (!giftBtnEl) return;

  giftBtnEl.addEventListener("click", giftBlook);
});

function giftBlook() {
  if (!selectedBlook || !selectedBlook.name) {
    showModal("Select a blook first");
    return;
  }

  const blookName = selectedBlook.name;
  const ownedEl = document.getElementById("amountOwned");
  const owned = ownedEl ? parseInt(ownedEl.textContent.split(" ")[0], 10) : Number(selectedBlook.owned ?? 0);

  const existing = document.getElementById("gift-blook-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "gift-blook-modal";
  modal.className = "sell-blook-modal-overlay";

  const box = document.createElement("div");
  box.className = "sell-blook-modal-box";

  const title = document.createElement("h3");
  title.className = "sell-blook-modal-title";
  title.textContent = `Gift ${blookName}?`;

  const subtitle = document.createElement("div");
  subtitle.className = "sell-blook-modal-subtitle";
  subtitle.textContent = `${owned} Owned`;

  const inputRowUser = document.createElement("div");
  inputRowUser.className = "sell-blook-modal-input-row";

  const userLabel = document.createElement("label");
  userLabel.className = "sell-blook-modal-label";
  userLabel.textContent =  "Player";

  const userInput = document.createElement("input");
  userInput.className = "sell-blook-modal-amount";
  userInput.type = "text";
  userInput.placeholder = "Username";
  userInput.style = "font-size: 16px;";


  inputRowUser.appendChild(userLabel);
  inputRowUser.appendChild(userInput);

  const inputRowQty = document.createElement("div");
  inputRowQty.className = "sell-blook-modal-input-row";

  const qtyLabel = document.createElement("label");
  qtyLabel.className = "sell-blook-modal-label";
  qtyLabel.textContent = "Amount";

  const qtyInput = document.createElement("input");
  qtyInput.className = "sell-blook-modal-amount";
  qtyInput.type = "number";
  qtyInput.min = "1";
  qtyInput.max = String(owned);
  qtyInput.value = "1";

  inputRowQty.appendChild(qtyLabel);
  inputRowQty.appendChild(qtyInput);

  const error = document.createElement("div");
  error.className = "sell-blook-modal-error";

  const actions = document.createElement("div");
  actions.className = "sell-blook-modal-actions";

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "sell-blook-modal-btn sell-blook-modal-btn-primary";
  confirmBtn.textContent = "Gift";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "sell-blook-modal-btn sell-blook-modal-btn-secondary";
  cancelBtn.textContent = "Cancel";

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);

  box.appendChild(title);
  box.appendChild(subtitle);
  box.appendChild(inputRowUser);
  box.appendChild(inputRowQty);
  box.appendChild(error);
  box.appendChild(actions);

  modal.appendChild(box);
  document.body.appendChild(modal);

  const close = () => modal.remove();
  cancelBtn.onclick = close;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") close();
    },
    { once: true }
  );

  confirmBtn.onclick = async () => {
    const recipientUsername = userInput.value.trim();
    const quantity = parseInt(qtyInput.value, 10);

    if (!recipientUsername) {
      error.textContent = "Enter a recipient username";
      return;
    }

    if (!quantity || quantity < 1 || quantity > owned) {
      error.textContent = "Invalid amount";
      return;
    }

    if (typeof window.showLoader === "function") window.showLoader();

    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    error.textContent = "";

    try {
      const logged = await fetch("/api/loggedin", { credentials: "include" });
      const loggedData = await logged.json();
      if (!logged.ok || !loggedData.loggedIn || !loggedData.user?.id) {
        error.textContent = "Not logged in";
        return;
      }

      const userId = loggedData.user.id;

      const res = await fetch("/api/users/gift-blook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: userId,
          blookName,
          quantity,
          recipientUsername,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        error.textContent = data?.error || "Failed to gift blook";
        return;
      }

      await loadBlooks();

      const amtEl = document.getElementById("amountOwned");
      if (amtEl && selectedBlook?.name) {
        const fresh = allBlooksFlat.find(
          (b) => (b?.name || "") === selectedBlook.name
        );

        const updated = Number(fresh?.owned ?? fresh?.owned?.amount ?? 0);
        amtEl.textContent = `${updated} Owned`;
        selectedBlook.owned = updated;
      }

      close();
    } catch (err) {
      console.error(err);
      error.textContent = "Server error";
    } finally {
      if (typeof window.hideLoader === "function") window.hideLoader();
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  };
}

function showModal(message) {
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
}

function listBlook() {
  if (!selectedBlook || !selectedBlook.name) {
    showModal("Select a blook first");
    return;
  }

  const blookName = selectedBlook.name;
  const blookImage = selectedBlook.imageUrl; 
  
  const modal = document.createElement("div");
  modal.id = "list-blook-modal";
  modal.className = "sell-blook-modal-overlay";

  const box = document.createElement("div");
  box.className = "sell-blook-modal-box";

  box.innerHTML = `
    <h3 class="sell-blook-modal-title">List ${blookName}</h3>
    <img src="${blookImage}" alt="${blookName}" style="width: auto;filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5)); height: 130px; margin: 10px auto; display: block;">
    <div class="sell-blook-modal-input-row">
      <label class="sell-blook-modal-label">Price</label>
      <input type="number" id="listPrice" class="sell-blook-modal-amount" min="1" value="100">
    </div>
    <div class="sell-blook-modal-error" id="listError"></div>
    <div class="sell-blook-modal-actions">
      <button type="button" id="confirmList" class="sell-blook-modal-btn sell-blook-modal-btn-primary">List</button>
      <button type="button" id="cancelList" class="sell-blook-modal-btn sell-blook-modal-btn-secondary">Cancel</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById("cancelList").onclick = close;
  
  document.getElementById("confirmList").onclick = async () => {
    const price = parseInt(document.getElementById("listPrice").value, 10);
    const errorEl = document.getElementById("listError");

    if (!price || price < 1) {
      errorEl.textContent = "Enter a valid price";
      return;
    }

    if (typeof window.showLoader === "function") window.showLoader();

    try {
      const res = await fetch('/api/users/listBlook', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blookName, price })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to list");

      showModal(`Your ${blookName} has been listed on bazaar`);
      close();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      if (typeof window.hideLoader === "function") window.hideLoader();
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  loadBlooks();
  const listBtnEl = document.querySelector(".listBtn");
  if (listBtnEl) {
    listBtnEl.addEventListener("click", listBlook);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadBlooks();

  const btn = document.querySelector('.changePfpBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!selectedBlook || !selectedBlook.imageUrl) {
      window.location.href = '/stats';
      return;
    }

    try {
      const res = await fetch('/api/user/changePfp', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pfp: selectedBlook.imageUrl })
      });

      window.location.href = '/stats';
    } catch (e) {
      console.error(e);
      window.location.href = '/stats';
    }
  });
});