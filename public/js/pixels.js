let allPacks = [];
let selectedBlook = null;

const container = document.querySelector(".pixelsContainer");

async function loadBlooks() {
  try {
    const res = await fetch("/api/blooks", {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error);
    }

    allPacks = data.packs || [];

    renderBlooks(allPacks);

  } catch (err) {
    console.error("loadBlooks error:", err);
  }
}

function renderBlooks(packs) {
  if (!container) return;

  container.innerHTML = "";

  if (!packs || !packs.length) {
    container.innerHTML = `
      <div style="
        color:white;
        font-size:24px;
        font-family:Pixelify Sans;
      ">
        No blooks found.
      </div>
    `;
    return;
  }

  packs.forEach(pack => {
    const packDiv = document.createElement("div");
    packDiv.className = "pack-section";

    const title = document.createElement("h2");
    title.textContent = pack.name;

    title.style.cssText = `
      color: white;
      font-size: 28px;
      margin-bottom: 15px;
      border-bottom: 3px solid white;
      width: fit-content;
      font-family: Pixelify Sans;
    `;

    packDiv.appendChild(title);

    const grid = document.createElement("div");

    grid.style.cssText = `
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin-bottom:30px;
    `;

    pack.blooks.forEach(blook => {
      const card = document.createElement("div");

      card.style.cssText = `
        width:100px;
        height:100px;
        background:rgba(255,255,255,0.08);
        border-radius:10px;
        display:flex;
        justify-content:center;
        align-items:center;
        position:relative;
        cursor:pointer;
        transition:0.2s;
      `;

      card.onmouseenter = () => {
        card.style.transform = "scale(1.05)";
      };

      card.onmouseleave = () => {
        card.style.transform = "scale(1)";
      };

      if (blook.owned > 0) {
        const img = document.createElement("img");

        img.src = blook.imageUrl;
        img.alt = blook.name;

        img.style.cssText = `
          width:65px;
          height:65px;
          object-fit:contain;
        `;

        card.appendChild(img);

        const badge = document.createElement("div");

        badge.innerText = `x${blook.owned}`;

        badge.style.cssText = `
          position:absolute;
          top:5px;
          right:5px;
          background:purple;
          color:white;
          padding:4px 8px;
          border-radius:20px;
          font-size:12px;
          font-weight:bold;
        `;

        card.appendChild(badge);

      } else {
        const lock = document.createElement("img");

        lock.src =
          "https://izumiihd.github.io/pixelitcdn/assets/img/icons/lock.png";

        lock.style.cssText = `
          width:40px;
          height:40px;
          opacity:0.8;
        `;

        card.appendChild(lock);
      }

      card.onclick = () => updateBlookInfo(blook);

      grid.appendChild(card);
    });

    packDiv.appendChild(grid);
    container.appendChild(packDiv);
  });
}

function updateBlookInfo(blook) {
  selectedBlook = blook;

  document.getElementById("blookName").innerText =
    blook.name;

  document.getElementById("blookRarity").innerText =
    blook.rarity;

  document.getElementById("blookImage").src =
    blook.imageUrl;

  document.getElementById("amountOwned").innerText =
    `Owned: ${blook.owned}`;
}

async function sellBlook(amount = 1) {
  if (!selectedBlook) return;

  try {
    const res = await fetch("/api/users/sellBlook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        name: selectedBlook.name,
        amount
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error);
    }

    loadBlooks();

  } catch (err) {
    console.error("sell error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBlooks();
});