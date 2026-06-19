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
  const res = await fetch("/api/bazaar/packs");
  allPacks = await res.json();
  renderPacks(allPacks);
}

async function loadBlooks() {
  const res = await fetch("/api/blooks");
  allBlooks = await res.json();
}

function renderPacks(packs) {
  packGrid.innerHTML = "";

  packs.forEach((pack) => {
    const card = document.createElement("div");
    card.className = "packCard";

    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${pack.packImageUrl}" alt="${pack.name}" />
        <div>
          <h3>${pack.name}</h3>
          <p>${pack.cost} Tokens</p>
        </div>
      </div>

      <div class="packStatus" style="color:${pack.visible ? "#00ff88" : "#ff4d4d"};">
        <span class="dot" style="background:${pack.visible ? "#00ff88" : "#ff4d4d"};"></span>
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
      width: 100%;
      background: transparent;
      padding: 10px 14px;
      font-weight: bold;
      text-align: center;
      border-radius: 10px;
      border: 3px solid white;
      color: white;
      font-size: 24px;
      font-family: "Pixelify Sans";
      outline: none;
      margin-bottom: 10px;
    `;

    box.appendChild(input);
    inputs.push(input);
  });

  const btn = document.createElement("button");
  btn.innerText = "Save";
  btn.style.cssText = `
    flex: 1;
    height: 52px;
    border: none;
    border-radius: 10px;
    font-family: 'Pixelify Sans', sans-serif;
    font-size: 22px;
    font-weight: 800;
    cursor: pointer;
    padding: 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s ease, filter 0.15s ease;
    background: #3aab3a;
    color: white;
    box-shadow: inset 0 -0.265vw rgba(0, 0, 0, 0.25), 3px 3px 14px rgba(0, 0, 0, 0.5);
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
    scroll: visible;
  `;

  panel.innerHTML = `
    <h2 id="editorTitle">Pack Editor</h2>
    <img id="editorImg" style="width:100%;border-radius:6px;margin-bottom:10px;">

    <div class="editorSection">
      <h3>Current Pixels</h3>
      <div id="packBlooks" class="editorList"></div>
    </div>

    <hr>

    <div class="editorSection">
      <h3>Add Pixels</h3>
      <button id="openBlookPicker" class="editorPrimaryBtn">Add Pixels</button>
      <p class="editorHint">Choose blooks from the picker modal.</p>
    </div>


    <button id="savePack">Save</button>
    <button id="deletePack">Delete</button>
  `;

  document.body.appendChild(panel);

  panel.onclick = (e) => {
    if (e.target === panel) closeEditor();
  };



  document.getElementById("openBlookPicker").onclick = () => {
    openBlookPickerModal();
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

function renderBlookListInto(containerEl, list = allBlooks) {
  if (!containerEl) return;
  containerEl.innerHTML = "";

  list.forEach((b) => {
    const item = document.createElement("div");
    item.className = "blookPickItem";

    item.innerHTML = `
      <div class="blookPickLeft">
        <img class="blookPickThumb" src="${b.imageUrl || ''}" alt="${b.blookName || ''}" />
        <span class="blookPickName">${b.blookName || 'Unknown blook'}</span>
      </div>

      <span class="blookPickRarity" style="color:${rarityColors[b.rarity] || "white"};">
        ${b.rarity || ''}
      </span>
    `;

    item.onclick = () => {
      selectedPack.blooks.push(b._id);
      renderPackBlooks();
    };

    containerEl.appendChild(item);
  });
}

function openBlookPickerModal() {
  if (!selectedPack) return;

  const existing = document.getElementById("blookPickModalOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "blookPickModalOverlay";
  overlay.className = "blookPickOverlay";

  const modal = document.createElement("div");
  modal.className = "blookPickModal";

  modal.innerHTML = `
    <div class="blookPickHeader">
      <h2 class="blookPickTitle">Pick Pixels</h2>
      <button type="button" class="blookPickClose" aria-label="Close">&times;</button>
    </div>

    <div class="blookPickControls">
      <input id="blookPickSearch" class="blookPickSearch" type="text" placeholder="Search blooks..." />
    </div>

    <div id="blookPickList" class="blookPickList"></div>

    <div class="blookPickFooter">
      <button type="button" class="blookPickFooterBtn" id="blookPickAddAllBtn">Done</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelector(".blookPickClose");
  closeBtn.onclick = () => overlay.remove();

  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const searchInput = modal.querySelector("#blookPickSearch");
  const listEl = modal.querySelector("#blookPickList");

  const applyFilter = () => {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const list = q
      ? allBlooks.filter((b) => (b.blookName || "").toLowerCase().includes(q))
      : allBlooks;
    renderBlookListInto(listEl, list);
  };

  if (searchInput) searchInput.addEventListener("input", applyFilter);

  applyFilter();

  modal.querySelector("#blookPickAddAllBtn").onclick = () => overlay.remove();
}