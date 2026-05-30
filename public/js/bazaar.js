function initBazaar() {
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none; position: fixed; z-index: 2000; left: 0; top: 0;
            width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7);
            cursor: pointer; align-items: center; justify-content: center;
        }
        .modal.show { display: flex !important; }

        .modal-content {
            background: #5e046e; padding: 25px; width: 900px; max-width: 90%;
            color: white; border-radius: 10px; text-align: center; cursor: default;
            box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);
        }

        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; border-bottom: 2px solid #53055c; padding-bottom: 10px;
        }
        .modal-header h2 { margin: 0; font-family: 'Pixelify Sans', sans-serif; font-size: 28px; }

        .close-icon { font-size: 24px; cursor: pointer; color: #ff0000; transition: 0.2s; }
        .close-icon:hover { color: #ff5555; }

        #userListingsContainer, #listingsContainer {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 15px; max-height: 400px; overflow-y: auto; margin-top: 15px;
        }

        .listing-card {
            cursor: pointer; transition: transform 0.2s;
            padding: 10px; border-radius: 8px;
        }
        .listing-card:hover { filter: brightness(1.2); }
        .listing-card.disabled { opacity: 0.6; cursor: not-allowed; }

        .modal-listing-wrapper { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .noListingText { text-align: center; }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'myListingsModal';
    modal.className = 'modal';
    modal.onclick = closeListModal;
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2>My Listings</h2>
                <i class="fas fa-times close-icon" onclick="closeListModal()"></i>
            </div>
            <div id="userListingsContainer"></div>
        </div>
    `;
    document.body.appendChild(modal);
}

function openListModal() {
    document.getElementById('myListingsModal').classList.add('show');
    loadUserListings();
}

function closeListModal() {
    document.getElementById('myListingsModal').classList.remove('show');
}

async function cancelListing(listingId) {
    const listingElement = event.currentTarget.parentElement;
    listingElement.style.display = 'none';

    try {
        const res = await fetch(`/api/bazaar/remove/${listingId}`, { method: 'POST' });
        if (!res.ok) {
            listingElement.style.display = 'flex';
            alert("Failed to remove listing.");
        } else {
            loadListings();
        }
    } catch (err) {
        listingElement.style.display = 'flex';
        console.error("Removal error", err);
    }
}

async function buyBlook(listing) {
    const confirmed = await confirmPurchase(listing);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/bazaar/buy/${listing.id}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            alert("Purchase successful!");
            loadListings();
        } else {
            alert(data.error || "Purchase failed.");
        }
    } catch (err) {
        console.error("Purchase error", err);
    }
}

function confirmPurchase(listing) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        
        const modalBox = document.createElement("div");
        modalBox.style.cssText = `padding: 25px; width: 400px; border-radius: 10px; text-align: center; color: white; font-family: 'Pixelify Sans', sans-serif; background: #5e046e; box-shadow: 3px 3px 15px rgba(0,0,0,0.6);`;

        modalBox.innerHTML = `
            <h3>Buy ${listing.blookName}?</h3>
            <p>Price: ${listing.price} tokens</p>
            <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                <button id="pYes" style="background:#27ae60; border:none; padding:10px 20px; color:white; border-radius:5px; cursor:pointer;">Confirm</button>
                <button id="pNo" style="background:#c0392b; border:none; padding:10px 20px; color:white; border-radius:5px; cursor:pointer;">Cancel</button>
            </div>
        `;
        overlay.appendChild(modalBox);
        document.body.appendChild(overlay);

        modalBox.querySelector("#pYes").onclick = () => { overlay.remove(); resolve(true); };
        modalBox.querySelector("#pNo").onclick = () => { overlay.remove(); resolve(false); };
    });
}

async function loadUserListings() {
    const container = document.getElementById('userListingsContainer');
    container.innerHTML = "Loading...";
    const res = await fetch("/api/bazaar/my-listings");
    const listings = await res.json();
    
    container.innerHTML = listings.length === 0 
        ? '<p class="noListingText">You have no active listings.</p>'
        : listings.map(l => `
            <div class="modal-listing-wrapper">
                <div class="listing-card" onclick="cancelListing('${l._id}')">
                    <img src="${l.imageUrl}" alt="${l.blookName}" class="bazaar-blook-img">
                    <div class="blook-name"><strong>${l.blookName}</strong></div>
                    <div class="price-tag">${l.price} tokens</div>
                </div>
            </div>`).join("");
}

async function loadListings() {
    const container = document.getElementById("listingsContainer");
    if (!container) return;
    
    const res = await fetch("/api/bazaar/listings");
    const data = await res.json(); 
    
    const listings = data.listings || [];
    const currentUserId = data.currentUser;

    if (listings.length === 0) {
        container.innerHTML = "<p>No listings available.</p>";
        return;
    }

    container.innerHTML = listings.map(l => {
        const isOwner = String(l.userId) === String(currentUserId);
        
        return `
            <div class="listing-card ${isOwner ? 'disabled' : ''}" 
                 onclick="${isOwner ? '' : `buyBlook({id: '${l._id}', blookName: '${l.blookName}', price: ${l.price}})`}">
                <img src="${l.imageUrl}" alt="${l.blookName}" class="bazaar-blook-img">
                <div class="blook-name"><strong>${l.blookName}</strong></div>
                <div class="price-tag">${l.price} tokens</div>
                ${isOwner ? '<p><small>Your Listing</small></p>' : ''}
            </div>`;
    }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    initBazaar();
    loadListings();
});