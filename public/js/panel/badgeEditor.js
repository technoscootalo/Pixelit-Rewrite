let selectedBadge = null;

const badgeGrid = document.getElementById("badgeGrid");
const nameEl = document.getElementById("badge-name");
const imageEl = document.getElementById("badge-image");

async function loadBadges() {
  const res = await fetch("/api/badges");
  const badges = await res.json();

  badgeGrid.innerHTML = "";

  badges.forEach(badge => {
    const img = document.createElement("img");
    img.src = badge.image;
    img.className = "badgeItem";

    img.onclick = () => selectBadge(badge);

    badgeGrid.appendChild(img);
  });
}

function selectBadge(badge) {
  selectedBadge = badge;

  nameEl.innerText = badge.name;
  imageEl.src = badge.image;

  // Enable delete button for the selected badge.
  const deleteBtn = document.getElementById("deleteBadgeBtn");
  if (deleteBtn) deleteBtn.disabled = false;
}

document.getElementById("deleteBadgeBtn").onclick = async () => {
  if (!selectedBadge) return;

  await fetch(`/api/badges/${selectedBadge._id}`, {
    method: "DELETE"
  });

  // Reset UI
  selectedBadge = null;
  nameEl.innerText = "Select Badge";
  imageEl.src = "";

  const deleteBtn = document.getElementById("deleteBadgeBtn");
  if (deleteBtn) deleteBtn.disabled = true;

  loadBadges();
};



document.getElementById("addBadgeBtn").onclick = () => {
  createBadgeModal();
};

function createBadgeModal() {
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
    background: #6f0083;
    padding: 20px;
    border-radius: 6px;
    width: 400px;
    text-align: center;
    box-shadow: inset 0 -0.365vw #53055c,
                3px 3px 15px rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  const title = document.createElement("h2");
  title.innerText = "Create Badge";
  box.appendChild(title);

  const nameInput = document.createElement("input");
  nameInput.placeholder = "Badge Name";

  const urlInput = document.createElement("input");
  urlInput.placeholder = "Image URL";

  [nameInput, urlInput].forEach(inp => {
    inp.style.cssText = `
      font-family: 'Pixelify Sans', sans-serif;
      width: 100%;
      height: 45px;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      background: transparent;
      border: 2px solid #5e046e;
      color: white;
      border-radius: 5px;
      outline: none;
    `;
    box.appendChild(inp);
  });

  const btnRow = document.createElement("div");
  btnRow.style.cssText = `
    display: flex;
    gap: 12px;
    margin-top: 10px;
  `;

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "Save";
  saveBtn.style.cssText = `
    flex: 1;
    background: #6f057a;
    box-shadow: inset 0 -0.3vw #53055c,
                3px 3px 10px rgba(0,0,0,0.5);
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
    font-family: 'Pixelify Sans', sans-serif;
  `;

  const cancelBtn = document.createElement("button");
  cancelBtn.innerText = "Cancel";
  cancelBtn.style.cssText = `
    flex: 1;
    background: #6f057a;
    box-shadow: inset 0 -0.3vw #53055c,
                3px 3px 10px rgba(0,0,0,0.5);
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
    font-family: 'Pixelify Sans', sans-serif;
  `;

  saveBtn.onclick = async () => {
    await fetch("/api/badges/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value,
        image: urlInput.value
      })
    });

    document.body.removeChild(modal);
    loadBadges();
  };

  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(cancelBtn);

  box.appendChild(btnRow);
  modal.appendChild(box);
  document.body.appendChild(modal);
}



loadBadges();