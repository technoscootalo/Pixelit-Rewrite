let allListings = [];
let currentUser = null;
let sendTokensModalEl = null;
let packsCache = [];
let listingsByBlookName = new Map();
let selectedPackName = null;

function showModal(message) {
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999999;`;

  const box = document.createElement('div');
  box.style.cssText = `background-color: #6f057a; z-index: 9999999; box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0,0,0,0.6); padding: 20px; border-radius: 8px; text-align: center; min-width: 280px; color: white; font-family: 'Pixelify Sans', sans-serif; font-size: 18px;`;

  box.innerText = message;
  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.onclick = () => modal.remove();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function confirmPurchase(listing) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 99999;`;

    const modalBox = document.createElement('div');
    modalBox.style.cssText = `padding: 25px; width: 440px; border-radius: 10px; text-align: center; color: white; font-family: 'Pixelify Sans', sans-serif; background: #5e046e; box-shadow: inset 0 -0.245vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);`;

    modalBox.innerHTML = `
      <h3 style="font-size: 26px; margin: 0; line-height: 1.2;">
        Buy <span style="color:#ffe66d">${escapeHtml(listing.blookName)}</span> for <span style="color:#ffe66d">${Number(listing.price).toLocaleString()}</span> tokens?
      </h3>
      <img src="${escapeHtml(listing.imageUrl)}" alt="${escapeHtml(listing.blookName)}" style="width: auto; height: 110px; margin: 14px auto 10px; filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5)); display:block;">
      <div style="margin-top:18px; display:flex; gap:10px; justify-content:center;">
        <button id="pYes" class="modal-btn modal-btn-primary">Confirm</button>
        <button id="pNo" class="modal-btn modal-btn-secondary">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.appendChild(modalBox);

    modalBox.querySelector('#pYes').onclick = () => {
      overlay.remove();
      resolve(true);
    };

    modalBox.querySelector('#pNo').onclick = () => {
      overlay.remove();
      resolve(false);
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });
  });
}

function getSelectedPack() {
  if (!selectedPackName) return null;
  return packsCache.find((p) => p && p.name === selectedPackName) || null;
}

const RARITY_COLORS = {
  common: "#ffffff",
  uncommon: "#4bc22e",
  rare: "#2f6cff",
  epic: "#be0000",
  legendary: "#ff910f",
  chroma: "#00ccff",
  mystical: "#9935dd"
};

function renderBlooksForSelectedPack({ filter = '' } = {}) {
  const container = document.getElementById('listingsContainer');
  if (!container) return;

  const pack = getSelectedPack();
  const mainEl = container.querySelector('#packDetails');


  if (!pack) {
    if (mainEl) {
      mainEl.innerHTML = '<p class="noListingText">No packs to display.</p>';
    }
    return;
  }

  const blooks = Array.isArray(pack.blooks) ? pack.blooks : [];

  const lower = (filter || '').toString().toLowerCase().trim();

  const filtered = lower
    ? blooks.filter((b) => ((b.blookName || b.name) + '').toLowerCase().includes(lower))
    : blooks;
    
  const rarityOrder = {
    uncommon: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
    chroma: 4,
    mystical: 5,
    common: 6
  };

  const sortedForRender = [...filtered].sort((b1, b2) => {
    const r1 = (b1?.rarity || "").toString().toLowerCase().trim();
    const r2 = (b2?.rarity || "").toString().toLowerCase().trim();
    const o1 = Object.prototype.hasOwnProperty.call(rarityOrder, r1) ? rarityOrder[r1] : 999;
    const o2 = Object.prototype.hasOwnProperty.call(rarityOrder, r2) ? rarityOrder[r2] : 999;
    if (o1 !== o2) return o1 - o2;
    return ((b1?.blookName || b1?.name || "").toString()).localeCompare((b2?.blookName || b2?.name || "").toString());
  });

  const blooksHtml = sortedForRender.length === 0
    ? '<p class="noListingText">No Pixels match your search.</p>'
    : sortedForRender
        .map((b) => {
          const blookName = (b.blookName || b.name || '').toString();
          const listings = listingsByBlookName.get(blookName) || [];
          const isListed = listings.length > 0;
          const listing = listings[0];


          const isOwner = isListed && String(listing.userId) === String(currentUser);

          const priceHtml = isListed
            ? `<div class="bazaar-blook-price">${Number(listing.price).toLocaleString()} <span class="bazaar-token">tokens</span></div>`
            : `<div class="bazaar-blook-price bazaar-blook-price--muted">Not listed</div>`;

          const rarity = b.rarity || '';

          const listingsSorted = [...listings].sort(
            (a, c) => Number(a.price ?? 0) - Number(c.price ?? 0)
          );

          const hasAny = listingsSorted.length > 0;
          const isOwnerOnly =
            hasAny && String(listingsSorted[0]?.userId) === String(currentUser);

          const actions = hasAny
            ? `
              <button
                type="button"
                class="bazaar-blook-action"
                data-blookupname="${escapeHtml(blookName)}"
                data-listings="${escapeHtml(JSON.stringify(listingsSorted))}"
              >
                ${isOwnerOnly ? 'Your Listing' : 'View Listings'}
              </button>
            `
            : `<div class="bazaar-blook-muted">—</div>`;

          return `
            <div class="pack-blook-card ${isOwner ? 'disabled' : ''} ${isListed ? '' : 'unlisted'}">
              <div class="pack-blook-left">
                <img src="${b.imageUrl || listing?.imageUrl || ''}" alt="${escapeHtml(blookName)}" class="bazaar-blook-img">
                <div class="pack-blook-meta">
                  <div class="blook-name"><strong>${escapeHtml(blookName)}</strong></div>
                  ${rarity
                    ? `<div class="blook-rarity" style="color:${RARITY_COLORS[(rarity || '').toString().toLowerCase()] || '#ffffff'};">${escapeHtml(rarity)}</div>`
                    : ''}

                  ${priceHtml}
                </div>
              </div>
              <div class="pack-blook-right">${actions}</div>
            </div>
          `;
        })
        .join('');

  if (mainEl) {
    mainEl.innerHTML = `
      <div class="pack-header">
        <div class="pack-title">${escapeHtml(pack.name)}</div>
        <div class="pack-subtitle">Cost: ${Number(pack.cost).toLocaleString()} tokens</div>
      </div>
      <div class="pack-blooks-container">${blooksHtml}</div>
    `;
  }
}

function renderPacksSidebar() {
  const container = document.getElementById('listingsContainer');
  if (!container) return;

  const backgrounds = {
    "OG Pack": "radial-gradient(circle, #ADD8E6, #335494)",
    "Color Pack": "radial-gradient(circle, #FFFF00, #8B8000)",
    "Fall Pack": "radial-gradient(circle, #DEB887, #8B4513)",
    "Halloween Pack": "radial-gradient(circle, #39272d, #67433e)",
    "Christmas Pack": "radial-gradient(circle, rgb(46, 139, 87), rgb(30, 86, 49), rgb(12, 45, 28), rgb(5, 20, 11))",
    "Space Pack": "radial-gradient(circle, #808080, #00008B)",
    "Technology Pack": "radial-gradient(circle, #346136, #2faa34)",
    "School Pack": "radial-gradient(circle, #836048, #66423a)",
    "Emoji Pack": "radial-gradient(circle, #fff176 0%, #fbc02d 60%, #f57f17 100%)",
    "Miscellaneous": "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
  };

  const packsHtml = packsCache && packsCache.length
    ? packsCache
        .map((p) => {
          const isActive = p.name === selectedPackName;
          const bg = backgrounds[p.name] || "#5e046e";
          return `
            <div class="pack-card ${isActive ? 'active' : ''}" onclick="selectPack('${escapeHtml(p.name)}')" style="background:${bg}; box-shadow: inset 0 -0.225vw rgba(0,0,0,0.35), 0 0 0 rgba(0,0,0,0);">
              <img src="${escapeHtml(p.packImageUrl)}" alt="${escapeHtml(p.name)}" class="pack-card-img" />
              <div class="pack-card-name">${escapeHtml(p.name)}</div>
            </div>
          `;
        })
        .join('')
    : '<p class="noListingText">No packs found.</p>';


  container.innerHTML = `
    <div class="packs-layout">
      <aside class="packs-sidebar">${packsHtml}</aside>
      <main class="packs-main" id="packDetails">
        ${selectedPackName ? '' : '<p class="noListingText">No packs to display.</p>'}
      </main>
    </div>
  `;
}

function renderAll() {
  renderPacksSidebar();
  renderBlooksForSelectedPack({ filter: document.getElementById('bazaarSearch')?.value || '' });
}

function renderPacks(filter = '') {
  const inputVal = (filter ?? '').toString();
  const container = document.getElementById('listingsContainer');
  if (!container) return;

  if (!container.querySelector('#packDetails')) {
    renderPacksSidebar();
  }

  if (selectedPackName) {
    renderBlooksForSelectedPack({ filter: inputVal });
  } else {
    const mainEl = container.querySelector('#packDetails');
    if (mainEl) mainEl.innerHTML = '<p class="noListingText">No packs to display.</p>';
  }
}

function selectPack(packName) {
  selectedPackName = packName;
  renderPacks(document.getElementById('bazaarSearch')?.value || '');
}

function openListingsModal({ blookName, blooksListings }) {
  const existing = document.getElementById('bazaar-listings-modal');
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'bazaar-listings-modal';
  overlay.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index: 99999; padding: 16px;`;

  const box = document.createElement('div');
  box.style.cssText = `width: 760px; max-width: 96vw; background: #5e046e; border-radius: 14px; box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0,0,0,0.6); padding: 18px; color:#fff;`;

  const listingsSorted = [...(blooksListings || [])].sort((a, c) => Number(a.price ?? 0) - Number(c.price ?? 0));

  box.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 10px; border-bottom: 2px solid rgba(83,5,92,0.9); padding-bottom: 10px;">
      <div>
        <div style="font-family: Pixelify Sans; font-size: 26px; font-weight: 900;">Listings</div>
        <div style="opacity:0.95; margin-top:4px; font-size: 14px;">${escapeHtml(blookName || '')}</div>
      </div>
      <button id="bazaar-listings-close" style="background:transparent; border:none; color:#ff4d4d; font-size: 28px; cursor:pointer;">×</button>
    </div>

    <div style="display:flex; flex-direction:column; gap:10px; max-height: 62vh; overflow:auto; padding-right: 6px;">
      ${listingsSorted.length
        ? listingsSorted
            .map((l) => {
              const isOwnerListing = String(l.userId) === String(currentUser);
              const price = Number(l.price ?? 0);
              return `
                <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.18); border: 2px solid rgba(255,255,255,0.10);">
                  <div style="display:flex; align-items:center; gap: 12px; min-width: 0;">
                    <img src="${escapeHtml(l.imageUrl || '')}" alt="${escapeHtml(l.blookName || '')}" style="width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 0 6px rgba(0,0,0,0.45));" />
                    <div style="min-width: 0;">
                      <div style="font-weight: 900; font-size: 18px; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;">${escapeHtml(l.username || l.listedBy || l.blookName || '')}</div>
                      <div style="opacity:0.9; font-size: 13px;">${isOwnerListing ? 'You' : 'Seller'}${isOwnerListing ? ' (yours)' : ''}</div>
                    </div>
                  </div>

                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap: 8px;">
                    <div style="color:#ffe66d; font-weight: 900; font-size: 18px;">${price.toLocaleString()} <span style="color: rgba(255,230,109,0.95); font-size: 14px;">tokens</span></div>
                    <button
                      style="height: 42px; border-radius: 10px; border:none; padding: 0 14px; font-family: Pixelify Sans; font-weight: 900; cursor:pointer; background: #3aab3a; color:white; box-shadow: inset 0 -0.265vw rgba(0,0,0,0.25), 3px 3px 14px rgba(0,0,0,0.5); ${isOwnerListing ? 'opacity:0.6; cursor:not-allowed; background:#5e046e;' : ''}"
                      ${isOwnerListing ? 'disabled' : ''}
                      onclick="${isOwnerListing ? '' : `buyBlook({ id: '${escapeHtml(l._id)}', blookName: '${escapeHtml(l.blookName)}', price: ${price}, imageUrl: '${escapeHtml(l.imageUrl || '')}' })` }"
                    >
                      ${isOwnerListing ? 'Your Listing' : 'Buy'}
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')
        : '<p class="noListingText">No listings found.</p>'}
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const closeBtn = box.querySelector('#bazaar-listings-close');
  closeBtn?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

async function buyBlook(listing) {
  const confirmed = await confirmPurchase(listing);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/bazaar/buy/${listing.id}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showModal(`Purchased ${listing.blookName}!`);
      allListings = [];
      listingsByBlookName = new Map();
      await loadAllBazaarData();

      const modal = document.getElementById('bazaar-listings-modal');
      if (modal) {
        const title = modal.querySelector('div[style*="font-size: 14px"]');
        const blookName = listing?.blookName || '';
        if (blookName) openListingsModal({ blookName, blooksListings: listingsByBlookName.get(blookName) || [] });
      }
    } else {
      showModal(data.error || 'Purchase failed.');
    }
  } catch (err) {
    console.error(err);
    showModal('Network error occurred.');
  }
}

function initBazaar() {
  const style = document.createElement('style');
  style.textContent = `
    .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); cursor: pointer; align-items: center; justify-content: center; }
    .modal.show { display: flex !important; }
    .modal-content { background: #5e046e; padding: 25px; width: 900px; max-width: 90%; color: white; border-radius: 10px; text-align: center; cursor: default; box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #53055c; padding-bottom: 10px; }
    .modal-header h2 { margin: 0; font-family: 'Pixelify Sans', sans-serif; font-size: 28px; }
    .close-icon { font-size: 0px; cursor: pointer; color: #ff0000; }
    #userListingsContainer { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto; margin-top: 15px; }
    .listing-card { cursor: pointer; transition: transform 0.2s; border-radius: 8px; }
    .listing-card:hover { filter: brightness(1.2); }
    .listing-card.disabled { opacity: 0.6; cursor: not-allowed; }
    .modal-listing-wrapper { display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .modal-btn { flex: 1; height: 52px; border: none; border-radius: 10px; font-family: 'Pixelify Sans', sans-serif; font-size: 22px; font-weight: 800; cursor: pointer; }
    .modal-btn-primary { background: #3aab3a; color: white; box-shadow: inset 0 -0.265vw rgba(0, 0, 0, 0.25), 3px 3px 14px rgba(0, 0, 0, 0.5); }
    .modal-btn-secondary { background: #5e046e; color: white; box-shadow: inset 0 -0.265vw #53055c, 3px 3px 14px rgba(0, 0, 0, 0.5); border: 2px solid rgba(255, 255, 255, 0.85); }
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

function openListModal() {
  document.getElementById('myListingsModal').classList.add('show');
  loadUserListings();
}

function closeListModal() {
  document.getElementById('myListingsModal').classList.remove('show');
}

async function loadUserListings() {
  const container = document.getElementById('userListingsContainer');
  if (!container) return;

  container.innerHTML = 'Loading...';

  try {
    const res = await fetch('/api/bazaar/my-listings');
    const listings = await res.json();

    container.innerHTML = listings.length === 0
      ? '<p>No active listings.</p>'
      : listings
          .map(
            (l) => `
              <div class="modal-listing-wrapper">
                <div class="listing-card" onclick="cancelListing('${l._id}')">
                  <img src="${escapeHtml(l.imageUrl)}" alt="${escapeHtml(l.blookName)}" style="width: 80px;">
                  <div><strong>${escapeHtml(l.blookName)}</strong></div>
                </div>
              </div>
            `
          )
          .join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error loading listings.</p>';
  }
}

async function cancelListing(id) {
  try {
    const res = await fetch(`/api/bazaar/remove/${id}`, { method: 'POST' });
    if (res.ok) {
      await loadAllBazaarData();
      closeListModal();
    } else {
      showModal('Failed to remove.');
    }
  } catch (err) {
    console.error(err);
    showModal('Error removing.');
  }
}

function openSendTokensModal() {
  if (sendTokensModalEl) return;

  sendTokensModalEl = document.createElement('div');
  sendTokensModalEl.className = 'sell-blook-modal-overlay';

  const box = document.createElement('div');
  box.className = 'sell-blook-modal-box';

  box.innerHTML = `
    <h3 class="sell-blook-modal-title">Send Tokens</h3>
    <div class="sell-blook-modal-input-row" style="margin-top: 10px;">
      <label class="sell-blook-modal-label" for="sendTokensRecipient">To</label>
      <input
        type="text"
        id="sendTokensRecipient"
        class="sell-blook-modal-amount"
        style="width: 200px;"
        placeholder="Recipient"
        autocomplete="off"
      />
    </div>

    <div class="sell-blook-modal-input-row">
      <label class="sell-blook-modal-label" for="sendTokensAmount">Token Amount</label>
      <input type="number" id="sendTokensAmount" class="sell-blook-modal-amount" min="1" max="5000000" value="1">
    </div>

    <div class="sell-blook-modal-error" id="sendTokensError"></div>

    <div class="sell-blook-modal-actions">
      <button type="button" id="confirmSendTokens" class="sell-blook-modal-btn sell-blook-modal-btn-primary">Send</button>
      <button type="button" id="cancelSendTokens" class="sell-blook-modal-btn sell-blook-modal-btn-secondary">Cancel</button>
    </div>
  `;

  sendTokensModalEl.onclick = () => closeSendTokensModal();
  box.onclick = (e) => e.stopPropagation();

  sendTokensModalEl.appendChild(box);
  document.body.appendChild(sendTokensModalEl);

  const recipientInput = document.getElementById('sendTokensRecipient');
  recipientInput?.focus();

  document.getElementById('cancelSendTokens')?.addEventListener('click', closeSendTokensModal);

  document.getElementById('confirmSendTokens')?.addEventListener('click', async () => {
    const recipientId = document.getElementById('sendTokensRecipient')?.value?.trim() || '';
    const amountRaw = document.getElementById('sendTokensAmount')?.value;
    const amount = Number(amountRaw);

    const errorEl = document.getElementById('sendTokensError');
    if (errorEl) errorEl.textContent = '';

    if (!recipientId) {
      if (errorEl) errorEl.textContent = 'Recipient is required.';
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      if (errorEl) errorEl.textContent = 'Amount must be a positive number.';
      return;
    }

    try {
      const res = await fetch('/api/sendTokens/sendTokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientUserId: recipientId, amount }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (errorEl) errorEl.textContent = data.error || 'Failed to send tokens.';
        return;
      }

      closeSendTokensModal();
      const sentUser = data?.recipient?.username || data?.recipient?.id || 'recipient';
      showModal(`You have sent ${Number(amount).toLocaleString()} tokens to ${sentUser}!`);
    } catch (e) {
      if (errorEl) errorEl.textContent = 'Network error occurred.';
    }
  });
}

function closeSendTokensModal() {
  if (sendTokensModalEl) {
    sendTokensModalEl.remove();
    sendTokensModalEl = null;
  }
}

async function loadAllBazaarData() {
  try {
    const [packsRes, listingsRes] = await Promise.all([
      fetch('/api/bazaar/packs'),
      fetch('/api/bazaar/listings'),
    ]);

    const packsData = await packsRes.json();
    const listingsData = await listingsRes.json();

    packsCache = Array.isArray(packsData) ? packsData : [];
    allListings = Array.isArray(listingsData.listings) ? listingsData.listings : [];
    currentUser = listingsData.currentUser;

    listingsByBlookName = new Map();
    for (const l of allListings) {
      const key = (l.blookName || '').toString();
      if (!key) continue;
      if (!listingsByBlookName.has(key)) listingsByBlookName.set(key, []);
      listingsByBlookName.get(key).push(l);
    }

    if (!packsCache.length) {
      selectedPackName = null;
    } else if (!selectedPackName || !packsCache.some((p) => p.name === selectedPackName)) {
      selectedPackName = packsCache[0].name;
    }

    renderAll();
  } catch (err) {
    console.error('Bazaar load error:', err);
    const container = document.getElementById('listingsContainer');
    if (container) {
      container.innerHTML = '<p class="noListingText">Failed to load bazaar data.</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBazaar();

  const searchInput = document.getElementById('bazaarSearch');
  const searchBtn = document.getElementById('searchBtn');

  searchInput?.addEventListener('input', (e) => renderPacks(e.target.value));
  searchBtn?.addEventListener('click', () => renderPacks(searchInput?.value || ''));

  const sendTokensBtn = document.querySelector('.sendTokens-btn');
  sendTokensBtn?.addEventListener('click', openSendTokensModal);

  document.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('.bazaar-blook-action');
    if (!btn) return;

    const blookName = btn.getAttribute('data-blookupname') || '';
    const listings = listingsByBlookName.get(blookName) || [];

    openListingsModal({ blookName, blooksListings: listings });
  });

  loadAllBazaarData();
});