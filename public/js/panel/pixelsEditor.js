let selectedBlook = null;

const nameEl = document.getElementById("blook-name");
const rarityEl = document.getElementById("blook-rarity");
const imageEl = document.getElementById("blook-image");
const priceEl = document.getElementById("blook-price");
const chanceEl = document.getElementById("blook-chance");
const grid = document.getElementById("blookGrid");
const previewPanel = document.querySelector(".previewPanel");

const rarityColors = {
  uncommon: "#4bc22e",
  rare: "blue",
  epic: "#be0000",
  legendary: "#ff910f",
  chroma: "#00ccff",
  mystical: "#9935dd"
};

function createModal({ title, fields = [], onSave }) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    font-family: 'Pixelify Sans', sans-serif;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: #6f057a;
    padding: 20px;
    border-radius: 6px;
    width: 420px;
    text-align: center;
    box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0,0,0,0.6);
  `;

  const h = document.createElement("h2");
  h.innerText = title;
  box.appendChild(h);

  const inputs = [];

  fields.forEach(f => {
    const input = document.createElement("input");
    input.placeholder = f.placeholder || "";
    input.value = f.value || "";

    input.style.cssText = `
      width: 85%;
      font-family: 'Pixelify Sans', sans-serif;
      height: 45px;
      margin: 6px 0;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      background: transparent;
      border: 2px solid #5e046e;
      color: white;
      border-radius: 4px;
    `;

    box.appendChild(input);
    inputs.push(input);
  });

  const btnRow = document.createElement("div");
  btnRow.style.cssText = `
    display: flex;
    gap: 10px;
    margin-top: 15px;
  `;

  const save = document.createElement("button");
  save.innerText = "Save";
  save.style.cssText = `
    flex: 1;
    background: #6f057a;
    box-shadow: inset 0 -0.3vw #53055c,
              3px 3px 10px rgba(0,0,0,0.5);
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
    text-shadow: #000 1px 0 13px;
    font-family: 'Pixelify Sans', sans-serif;
  `;

  const cancel = document.createElement("button");
  cancel.innerText = "Cancel";
  cancel.style.cssText = `
    flex: 1;
    background: #6f057a;
    box-shadow: inset 0 -0.3vw #53055c,
              3px 3px 10px rgba(0,0,0,0.5);
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
    text-shadow: #000 1px 0 13px;
    font-family: 'Pixelify Sans', sans-serif;
  `;

  save.onclick = async () => {
    const values = inputs.map(i => i.value);
    await onSave(values);
    document.body.removeChild(modal);
  };

  cancel.onclick = () => {
    document.body.removeChild(modal);
  };

  btnRow.appendChild(save);
  btnRow.appendChild(cancel);

  box.appendChild(btnRow);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

async function loadBlooks() {
  const res = await fetch("/api/blooks");
  const blooks = await res.json();

  grid.innerHTML = "";

  blooks.forEach(blook => {
    const img = document.createElement("img");
    img.src = blook.imageUrl;
    img.className = "blookItem";

    img.onclick = () => selectBlook(blook);

    grid.appendChild(img);
  });
}
function selectBlook(blook) {
  selectedBlook = blook;

  nameEl.innerText = blook.blookName;
  rarityEl.innerText = blook.rarity;
  imageEl.src = blook.imageUrl;

  priceEl.innerText = `Price - ${blook.price}`;
  chanceEl.innerText = `Chance - ${blook.chance}%`;

  const key = (blook.rarity || "").toLowerCase();
  rarityEl.style.color = rarityColors[key] || "white";

  if (previewPanel) {
    const bg = blook.backgroundUrl;

    previewPanel.style.backgroundColor = "transparent";

    previewPanel.style.backgroundImage = bg ? `url(${bg})` : "none";
    previewPanel.style.backgroundSize = "cover";
    previewPanel.style.backgroundPosition = "center";
    previewPanel.style.backgroundRepeat = "no-repeat";

    previewPanel.style.boxShadow = `
      inset 0 0 80px rgba(0,0,0,0.55),
      inset 0 0 140px rgba(0,0,0,0.35),
      inset 0 -6px rgba(0,0,0,0.4),
      3px 3px 15px rgba(0,0,0,0.6)
    `;
  }
}

document.getElementById("addBlookBtn").onclick = () => {
  createModal({
    title: "Create Blook",
    fields: [
      { placeholder: "Name" },
      { placeholder: "Rarity" },
      { placeholder: "Image URL" },
      { placeholder: "Background URL" },
      { placeholder: "Price" },
      { placeholder: "Chance" }
    ],
    onSave: async (v) => {
      await fetch("/api/blooks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blookName: v[0],
          rarity: v[1],
          imageUrl: v[2],
          backgroundUrl: v[3],
          price: v[4],
          chance: v[5]
        })
      });

      loadBlooks();
    }
  });
};

async function editBlook() {
  if (!selectedBlook) return;

  createModal({
    title: "Edit Blook",
    fields: [
      { placeholder: "Blook Name", value: selectedBlook.blookName },
      { placeholder: "Rarity", value: selectedBlook.rarity },
      { placeholder: "Image URL", value: selectedBlook.imageUrl },
      { placeholder: "Background URL", value: selectedBlook.backgroundUrl || "" },
      { placeholder: "Price", value: selectedBlook.price },
      { placeholder: "Chance", value: selectedBlook.chance }
    ],
    onSave: async (v) => {
      await fetch(`/api/blooks/${selectedBlook._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blookName: v[0],
          rarity: v[1],
          imageUrl: v[2],
          backgroundUrl: v[3],
          price: Number(v[4]),
          chance: Number(v[5])
        })
      });

      loadBlooks();
    }
  });
}

async function cloneBlook() {
  if (!selectedBlook) return;

  await fetch("/api/blooks/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blookName: selectedBlook.blookName + " Copy",
      rarity: selectedBlook.rarity,
      imageUrl: selectedBlook.imageUrl,
      backgroundUrl: selectedBlook.backgroundUrl,
      price: selectedBlook.price,
      chance: selectedBlook.chance
    })
  });

  loadBlooks();
}

async function deleteBlook() {
  if (!selectedBlook) return;

  createModal({
    title: `Delete ${selectedBlook.blookName}?`,
    fields: [],
    onSave: async () => {
      await fetch(`/api/blooks/${selectedBlook._id}`, {
        method: "DELETE"
      });

      selectedBlook = null;
      nameEl.innerText = "name";
      rarityEl.innerText = "rarity";
      imageEl.src = "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";

      loadBlooks();
    }
  });
}

document.querySelector(".editBtn").onclick = editBlook;
document.querySelector(".cloneBtn").onclick = cloneBlook;
document.querySelector(".deleteBtn").onclick = deleteBlook;

loadBlooks();