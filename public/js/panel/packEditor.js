const packGrid = document.getElementById("packGrid");
const addPackBtn = document.getElementById("addPackBtn");

let allPacks = [];
let allBlooks = [];
let selectedPack = null;

const rarityColors = {
  uncommon: "#4bc22e",
  rare: "blue",
  epic: "#be0000",
  legendary: "#ff910f",
  chroma: "#00ccff",
  mystical: "#9935dd"
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadBlooks();
  await loadPacks();
  createEditorPanel();
});

async function loadPacks() {
  const res = await fetch("/api/packs");
  allPacks = await res.json();
  renderPacks(allPacks);
}

async function loadBlooks() {
  const res = await fetch("/api/blooks");
  allBlooks = await res.json();
}

function renderPacks(packs) {
  packGrid.innerHTML = "";

  packs.forEach(pack => {
    const card = document.createElement("div");

    card.className = "packCard";
    card.style.cssText = `
      height: 80px;
      padding: 10px;
      background: #6f057a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 6px;
      box-shadow: inset 0 -0.3vw #53055c, 3px 3px 10px rgba(0,0,0,0.4);
      cursor: pointer;
    `;

    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${pack.packImageUrl}" style="width:50px;height:50px;border-radius:5px;object-fit:cover;">
        <div>
          <h3 style="margin:0;">${pack.name}</h3>
          <p style="margin:0;opacity:0.8;">${pack.cost} coins</p>
        </div>
      </div>

      <div style="color:${pack.visible ? "#00ff88" : "red"};font-weight:bold;">
        ${pack.visible ? "VISIBLE" : "HIDDEN"}
      </div>
    `;

    card.onclick = () => openEditor(pack);

    packGrid.appendChild(card);
  });
}

function createModal({ title, fields = [], onSave }) {
  const modal = document.createElement("div");
  modal.style.cssText = `
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

  box.onclick = (e) => e.stopPropagation();

  const h = document.createElement("h2");
  h.innerText = title;
  box.appendChild(h);

  const inputs = [];

  fields.forEach(ph => {
    const input = document.createElement("input");
    input.placeholder = ph;

    input.style.cssText = `
      width: 90%;
      height: 40px;
      margin: 6px 0;
      text-align: center;
      background: transparent;
      border: 2px solid #5e046e;
      color: white;
      border-radius: 4px;
    `;

    box.appendChild(input);
    inputs.push(input);
  });

  const btn = document.createElement("button");
  btn.innerText = "Save";
  btn.style.cssText = `
    margin-top: 10px;
    width: 100%;
    padding: 10px;
    background: #53055c;
    border: none;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  `;

  btn.onclick = async () => {
    await onSave(inputs.map(i => i.value));
    modal.remove();
  };

  box.appendChild(btn);
  modal.appendChild(box);
  document.body.appendChild(modal);

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

addPackBtn.onclick = () => {
  createModal({
    title: "Create Pack",
    fields: ["Pack Name", "Image URL", "Background URL", "Cost", "Visible (true/false)"],
    onSave: async (v) => {
      const [name, image, background, cost, visible] = v;
 
      // allow packBackground to be any CSS-ready value (hex, gradients, etc.)
      // If empty, default to ""
      const packBackground = (background ?? "").toString().trim();

      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          packImageUrl: image,
          packBackground,
          cost: Number(cost),
          visible: visible === "true"
        })
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      loadPacks();
    }
  });
};

function createEditorPanel() {
  const panel = document.createElement("div");

  panel.id = "editor";
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: -100%;
    width: 420px;
    height: 100vh;
    background: #5e046e;
    color: white;
    padding: 15px;
    overflow-y: auto;
    transition: 0.3s;
    z-index: 9998;
  `;

  panel.innerHTML = `
    <h2 id="editorTitle">Pack Editor</h2>
    <img id="editorImg" style="width:100%;border-radius:6px;margin-bottom:10px;">

    <h3>Current Blooks</h3>
    <div id="packBlooks"></div>

    <hr>

    <h3>Add Blooks</h3>
    <div id="blookList"></div>

    <button id="savePack">Save</button>
    <button id="deletePack">Delete</button>
  `;

  document.body.appendChild(panel);

  panel.onclick = (e) => {
    if (e.target === panel) closeEditor();
  };

  document.getElementById("savePack").onclick = async () => {
    const blookIds = (selectedPack.blooks || [])
      .map(b => (typeof b === "string" ? b : b?._id || b?.id))
      .filter(Boolean);

    await fetch(`/api/packs/${selectedPack._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...selectedPack,
        blooks: blookIds
      })
    });

    loadPacks();
    closeEditor();
  };

  document.getElementById("deletePack").onclick = async () => {
    await fetch(`/api/packs/${selectedPack._id}`, {
      method: "DELETE"
    });

    loadPacks();
    closeEditor();
  };
}

function openEditor(pack) {
  selectedPack = structuredClone(pack);

  selectedPack.blooks = (selectedPack.blooks || [])
    .map(b => (typeof b === "string" ? b : b?._id || b?.id))
    .filter(Boolean);

  const panel = document.getElementById("editor");
  panel.style.right = "0";

  document.getElementById("editorTitle").innerText = pack.name;
  document.getElementById("editorImg").src = pack.packImageUrl;

  renderPackBlooks();
  renderBlookList();
}

function closeEditor() {
  document.getElementById("editor").style.right = "-100%";
  selectedPack = null;
}

function renderPackBlooks() {
  const box = document.getElementById("packBlooks");
  box.innerHTML = "";

  (selectedPack.blooks || []).forEach((blookId, i) => {
    const b = allBlooks.find(x => x._id === blookId) || {};

    const div = document.createElement("div");

    div.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      background:#6f057a;
      padding:6px;
      margin:5px 0;
      border-radius:5px;
    `;

    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${b.imageUrl || ''}" style="width:35px;height:35px;border-radius:4px;">
        <span>${b.blookName || 'Unknown blook'}</span>
      </div>
      <button style="background:red;color:white;border:none;padding:5px;">X</button>
    `;

    div.querySelector("button").onclick = () => {
      selectedPack.blooks.splice(i, 1);
      renderPackBlooks();
    };

    box.appendChild(div);
  });
}

function renderBlookList() {
  const box = document.getElementById("blookList");
  box.innerHTML = "";

  allBlooks.forEach(b => {
    const div = document.createElement("div");

    div.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:6px;
      margin:5px 0;
      border-radius:5px;
      background:#53055c;
      cursor:pointer;
    `;

    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${b.imageUrl}" style="width:35px;height:35px;border-radius:4px;">
        <span>${b.blookName}</span>
      </div>

      <span style="
        color:${rarityColors[b.rarity] || "white"};
        font-weight:bold;
      ">
        ${b.rarity}
      </span>
    `;

    div.onclick = () => {
      selectedPack.blooks.push(b._id);
      renderPackBlooks();
    };

    box.appendChild(div);
  });
}