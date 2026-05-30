let allListings = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    initBazaar();
    loadListings();

    const searchInput = document.getElementById('bazaarSearch');
    const searchBtn = document.getElementById('searchBtn');

    searchInput?.addEventListener('input', (e) => loadListings(e.target.value));
    searchBtn?.addEventListener('click', () => loadListings(searchInput?.value || ""));
});

function showModal(message) {
    const modal = document.createElement("div");
    modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10000;`;
    const box = document.createElement("div");
    box.style.cssText = `background-color: #6f057a; box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0,0,0,0.6); padding: 20px; border-radius: 8px; text-align: center; min-width: 280px; color: white; font-family: 'Pixelify Sans', sans-serif; font-size: 18px;`;
    box.innerText = message;
    modal.appendChild(box);
    document.body.appendChild(modal);
    modal.onclick = () => modal.remove();
}

function confirmPurchase(listing) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        
        const modalBox = document.createElement("div");
        modalBox.style.cssText = `padding: 25px; width: 400px; border-radius: 10px; text-align: center; color: white; font-family: 'Pixelify Sans', sans-serif; background: #5e046e; box-shadow: inset 0 -0.245vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);`;

        modalBox.innerHTML = `
            <h3 style="font-size: 26px; margin: 0;">Do you want to buy ${listing.blookName} for ${listing.price.toLocaleString()} tokens?</h3>
            <img src="${listing.imageUrl}" alt="${listing.blookName}" style="width: auto; height: 100px; margin-bottom: 10px;filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));">
            <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                <button id="pYes" class="modal-btn modal-btn-primary">Confirm</button>
                <button id="pNo" class="modal-btn modal-btn-secondary">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.appendChild(modalBox);

        modalBox.querySelector("#pYes").onclick = () => { overlay.remove(); resolve(true); };
        modalBox.querySelector("#pNo").onclick = () => { overlay.remove(); resolve(false); };
    });
}

async function loadListings(filter = "") {
    const container = document.getElementById("listingsContainer");
    if (!container) return;

    if (allListings.length === 0) {
        try {
            const res = await fetch("/api/bazaar/listings");
            const data = await res.json();
            allListings = data.listings || [];
            currentUser = data.currentUser;
        } catch (err) { console.error("Load error:", err); return; }
    }

    const filtered = allListings.filter(l => l.blookName.toLowerCase().includes(filter.toLowerCase()));

    container.innerHTML = filtered.length === 0 ? '<p class="noListingText">No matching blooks found.</p>' : 
        filtered.map(l => {
            const isOwner = String(l.userId) === String(currentUser);
            return `
                <div class="listing-card ${isOwner ? 'disabled' : ''}" 
                     onclick="${isOwner ? '' : `buyBlook({id: '${l._id}', blookName: '${l.blookName}', price: ${l.price}, imageUrl: '${l.imageUrl}', seller: '${l.sellerUsername || 'someone'}'})`}">
                    <img src="${l.imageUrl}" alt="${l.blookName}" class="bazaar-blook-img">
                    <div class="blook-name"><strong>${l.blookName}</strong></div>
                    <div class="price-tag">${l.price.toLocaleString()} tokens</div>
                    ${isOwner ? '<p><small>Your Listing</small></p>' : ''}
                </div>`;
        }).join("");
}

async function buyBlook(listing) {
    const confirmed = await confirmPurchase(listing);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/bazaar/buy/${listing.id}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showModal(`You have bought ${listing.blookName} for ${listing.price.toLocaleString()} tokens!`);
            allListings = []; 
            loadListings();
        } else {
            showModal(data.error || "Purchase failed.");
        }
    } catch (err) { showModal("Network error occurred."); }
}

function initBazaar() {
    const style = document.createElement('style');
    style.textContent = `
        .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); cursor: pointer; align-items: center; justify-content: center; }
        .modal.show { display: flex !important; }
        .modal-content { background: #5e046e; padding: 25px; width: 900px; max-width: 90%; color: white; border-radius: 10px; text-align: center; cursor: default; box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #53055c; padding-bottom: 10px; }
        .modal-header h2 { margin: 0; font-family: 'Pixelify Sans', sans-serif; font-size: 28px; }
        .close-icon { font-size: 24px; cursor: pointer; color: #ff0000; }
        #userListingsContainer { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto; margin-top: 15px; }
        .listing-card { cursor: pointer; transition: transform 0.2s; padding: 10px; border-radius: 8px;}
        .listing-card:hover { filter: brightness(1.2); }
        .listing-card.disabled { opacity: 0.6; cursor: not-allowed; }
        .modal-listing-wrapper { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .modal-btn { flex: 1; height: 52px; border: none; border-radius: 10px; font-family: 'Pixelify Sans', sans-serif; font-size: 22px; font-weight: 800; cursor: pointer; }
        .modal-btn-primary { background: #3aab3a; color: white; box-shadow: inset 0 -0.265vw rgba(0, 0, 0, 0.25), 3px 3px 14px rgba(0,0,0,0.5); }
        .modal-btn-secondary { background: #5e046e; color: white; box-shadow: inset 0 -0.265vw #53055c, 3px 3px 14px rgba(0,0,0,0.5); border: 2px solid rgba(255, 255, 255, 0.85); }
        .modal-btn-primary:hover, .modal-btn.modal-btn-secondary:hover { filter: brightness(1.08); }
    `;
    document.head.appendChild(style);
    const modal = document.createElement('div');
    modal.id = 'myListingsModal';
    modal.className = 'modal';
    modal.onclick = closeListModal;
    modal.innerHTML = `<div class="modal-content" onclick="event.stopPropagation()"><div class="modal-header"><h2>My Listings</h2><i class="fas fa-times close-icon" onclick="closeListModal()"></i></div><div id="userListingsContainer"></div></div>`;
    document.body.appendChild(modal);
}

function openListModal() { document.getElementById('myListingsModal').classList.add('show'); loadUserListings(); }
function closeListModal() { document.getElementById('myListingsModal').classList.remove('show'); }

async function loadUserListings() {
    const container = document.getElementById('userListingsContainer');
    container.innerHTML = "Loading...";
    const res = await fetch("/api/bazaar/my-listings");
    const listings = await res.json();
    container.innerHTML = listings.length === 0 ? '<p>No active listings.</p>' : listings.map(l => `
        <div class="modal-listing-wrapper">
            <div class="listing-card" onclick="cancelListing('${l._id}')">
                <img src="${l.imageUrl}" alt="${l.blookName}" style="width: 80px;">
                <div><strong>${l.blookName}</strong></div>
            </div>
        </div>`).join("");
}

async function cancelListing(id) {
    try {
        const res = await fetch(`/api/bazaar/remove/${id}`, { method: 'POST' });
        if (res.ok) { allListings = []; loadListings(); closeListModal(); }
        else showModal("Failed to remove.");
    } catch (err) { showModal("Error removing."); }
}