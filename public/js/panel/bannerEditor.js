let selectedBanner = null;

const bannerGrid = document.getElementById("bannerGrid");

async function loadBanners() {
  const res = await fetch("/api/banners");
  const banners = await res.json();

  bannerGrid.innerHTML = "";

  banners.forEach(banner => {
    const img = document.createElement("img");
    img.src = banner.image;
    img.className = "bannerItem";

    img.onclick = () => selectBanner(banner);

    bannerGrid.appendChild(img);
  });
}

function selectBanner(banner) {
  selectedBanner = banner;

  openBannerModal(banner);
}

document.getElementById("addBannerBtn").onclick = () => {
  openBannerModal();
};

function openBannerModal(banner = null) {
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
  title.innerText = banner ? "Edit Banner" : "Create Banner";
  box.appendChild(title);

  const nameInput = document.createElement("input");
  nameInput.placeholder = "Banner Name";

  const urlInput = document.createElement("input");
  urlInput.placeholder = "Image URL";

  if (banner) {
    nameInput.value = banner.name;
    urlInput.value = banner.image;
  }

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
    if (banner) {
      await fetch(`/api/banners/${banner._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          image: urlInput.value
        })
      });
    } else {
      await fetch("/api/banners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          image: urlInput.value
        })
      });
    }

    document.body.removeChild(modal);
    loadBanners();
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

loadBanners();