const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const tradeId = urlParams.get('id');

let currentUsername = '';
let partnerUsername = '';
let myPacks = [];
let myTokens = 0;
let myOffer = { tokens: 0, pixels: [] };
let theirOffer = { tokens: 0, pixels: [] };
let iAmReady = false;
let theyAreReady = false;

function ge(id) {
  return document.getElementById(id);
}

if (!tradeId) {
  window.location.href = '/stats';
}

fetch('/api/user', { method: 'GET', credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    currentUsername = data.username;
    myPacks = data.packs || [];
    myTokens = data.tokens || 0;
    ge('your-username').textContent = data.username;
    if (data.pfp) ge('your-pfp').src = data.pfp;
    ge('your-tokens').max = myTokens;
    socket.emit('joinUserRoom', { username: currentUsername });
    socket.emit('joinTradeRoom', { tradeId, username: currentUsername });
    renderPixelPicker();
  })
  .catch(() => {
    window.location.href = '/login';
  });

function renderPixelPicker(filter = '') {
  const grid = ge('pixel-picker-grid');
  grid.innerHTML = '';
  const lowerFilter = filter.toLowerCase();

  myPacks.forEach(pack => {
    (pack.blooks || []).forEach(blook => {
      if (blook.owned > 0 && blook.name.toLowerCase().includes(lowerFilter)) {
        const item = document.createElement('div');
        item.className = 'pixel-picker-item';
        item.innerHTML = `
          <img src="${blook.imageUrl}" alt="${blook.name}" onerror="this.src='https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png'" />
          <div class="picker-name">${blook.name}</div>
          <div class="picker-qty">x${blook.owned}</div>
        `;
        item.onclick = () => addToOffer(blook, pack.name);
        grid.appendChild(item);
      }
    });
  });
}

ge('pixel-search').addEventListener('input', (e) => {
  renderPixelPicker(e.target.value);
});

ge('your-tokens').addEventListener('change', (e) => {
  let val = parseInt(e.target.value) || 0;
  if (val > myTokens) {
    val = myTokens;
    e.target.value = val;
  }
  myOffer.tokens = Math.max(0, val);
  emitTradeUpdate();
});

function emitTradeUpdate() {
  iAmReady = false;
  updateReadyDisplay();
  socket.emit('tradeUpdate', { tradeId, username: currentUsername, offer: myOffer });
}

function addToOffer(blook, parentName) {
  const existing = myOffer.pixels.find(p => p.name === blook.name);
  if (existing) {
    const owned = getOwnedCount(blook.name);
    if (existing.quantity < owned) {
      existing.quantity++;
    }
  } else {
    myOffer.pixels.push({
      name: blook.name,
      imageUrl: blook.imageUrl,
      rarity: blook.rarity,
      parent: parentName,
      quantity: 1
    });
  }
  renderMyOffer();
  emitTradeUpdate();
}

function removeFromOffer(blookName) {
  const idx = myOffer.pixels.findIndex(p => p.name === blookName);
  if (idx !== -1) {
    myOffer.pixels[idx].quantity--;
    if (myOffer.pixels[idx].quantity <= 0) {
      myOffer.pixels.splice(idx, 1);
    }
  }
  renderMyOffer();
  emitTradeUpdate();
}

function getOwnedCount(blookName) {
  for (const pack of myPacks) {
    const b = (pack.blooks || []).find(x => x.name === blookName);
    if (b) return b.owned;
  }
  return 0;
}

function renderMyOffer() {
  const grid = ge('your-offer-grid');
  grid.innerHTML = '';
  myOffer.pixels.forEach(p => {
    const div = document.createElement('div');
    div.className = 'offer-item';
    div.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png'" />
      <span class="qty-badge">${p.quantity}</span>
      <div class="offer-name">${p.name}</div>
    `;
    div.onclick = () => removeFromOffer(p.name);
    grid.appendChild(div);
  });
}

function renderTheirOffer() {
  const grid = ge('their-offer-grid');
  grid.innerHTML = '';
  theirOffer.pixels.forEach(p => {
    const div = document.createElement('div');
    div.className = 'offer-item';
    div.innerHTML = `
      <img src="${p.imageUrl || 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png'}" alt="${p.name}" />
      <span class="qty-badge">${p.quantity}</span>
      <div class="offer-name">${p.name}</div>
    `;
    grid.appendChild(div);
  });
  ge('their-tokens').textContent = theirOffer.tokens;
}

function updateReadyDisplay() {
  const status = ge('ready-status');
  const acceptBtn = ge('accept-trade');
  if (iAmReady && theyAreReady) {
    status.textContent = 'Both ready! Executing trade...';
    acceptBtn.textContent = 'Executing...';
  } else if (iAmReady) {
    status.textContent = 'Waiting for partner...';
    acceptBtn.innerHTML = '<i class="fa-solid fa-check"></i> Ready!';
    acceptBtn.classList.add('ready');
  } else {
    status.textContent = theyAreReady ? 'Partner is ready!' : '';
    acceptBtn.innerHTML = '<i class="fa-solid fa-check"></i> Accept';
    acceptBtn.classList.remove('ready');
  }
}

function showTradeEndedModal(who, reason) {
  const existing = document.getElementById('trade-ended-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'trade-ended-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background-color: #5e046e;
    box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    width: 350px;
    font-family: 'Pixelify Sans';
    color: white;
  `;

  const icon = document.createElement('div');
  icon.innerHTML = '<i class="fa-solid fa-circle-xmark" style="font-size: 48px; color: #ff5252;"></i>';
  icon.style.marginBottom = '15px';
  content.appendChild(icon);

  const title = document.createElement('div');
  title.textContent = reason === 'declined' ? 'Trade Declined' : 'Trade Ended';
  title.style.fontSize = '22px';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  content.appendChild(title);

  const msg = document.createElement('div');
  msg.textContent = reason === 'declined' ? `${who} declined your trade request.` : `${who} exited the trade.`;
  msg.style.fontSize = '16px';
  msg.style.marginBottom = '20px';
  content.appendChild(msg);

  const btn = document.createElement('button');
  btn.textContent = 'Return to stats';
  btn.style.cssText = `
    background-color: #1976d2;
    box-shadow: inset 0 -0.265vw #0d47a1, 3px 3px 15px rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Pixelify Sans';
    font-size: 16px;
    font-weight: bold;
    width: 100%;
  `;
  btn.onclick = () => window.location.href = '/stats';
  content.appendChild(btn);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

socket.on('tradeState', (trade) => {
  partnerUsername = trade.sender === currentUsername ? trade.recipient : trade.sender;

  fetch('/api/viewUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: partnerUsername })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        ge('their-username').textContent = data.user.username;
        if (data.user.pfp) ge('their-pfp').src = data.user.pfp;
      }
    });

  if (trade.sender === currentUsername) {
    myOffer = trade.senderOffer;
    theirOffer = trade.recipientOffer;
  } else {
    myOffer = trade.recipientOffer;
    theirOffer = trade.senderOffer;
  }
  renderMyOffer();
  renderTheirOffer();
  ge('your-tokens').value = myOffer.tokens;
});

socket.on('tradeUpdate', (data) => {
  if (data.username !== currentUsername) {
    theirOffer = data.offer;
    theyAreReady = false;
    renderTheirOffer();
    updateReadyDisplay();
  }
});

socket.on('tradeAccept', (data) => {
  if (data.username !== currentUsername) {
    theyAreReady = true;
    updateReadyDisplay();
  }
});

socket.on('tradeResetReady', () => {
  iAmReady = false;
  theyAreReady = false;
  updateReadyDisplay();
});

socket.on('tradeExecute', async () => {
  try {
    const res = await fetch('/executeTrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeId,
        partner: partnerUsername,
        myOffer,
        theirOffer
      })
    });
    const data = await res.json();
    if (data.success) {
      socket.emit('tradeNotifySuccess', { tradeId });
    } else {
      alert(data.message || 'Trade failed.');
      iAmReady = false;
      theyAreReady = false;
      updateReadyDisplay();
    }
  } catch (err) {
    console.error(err);
    alert('Trade execution error.');
  }
});

socket.on('tradeSuccess', () => {
  alert('Trade completed successfully!');
  window.location.href = '/stats';
});

socket.on('tradeCancelled', (data) => {
  const who = data && data.by ? data.by : 'User';
  showTradeEndedModal(who, 'exited');
});

socket.on('tradeDeclined', (data) => {
  const who = data && data.by ? data.by : 'User';
  showTradeEndedModal(who, 'declined');
});

socket.on('tradeChat', (data) => {
  appendChatMessage(data.sender, data.msg);
});

socket.on('tradeError', (msg) => {
  alert(msg);
  window.location.href = '/stats';
});

function appendChatMessage(sender, msg) {
  const container = ge('trade-chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-message';
  div.innerHTML = `<span class="msg-sender">${sender}:</span> ${msg}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

ge('trade-chat-send').onclick = sendChatMessage;
ge('trade-chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
  const input = ge('trade-chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  socket.emit('tradeChat', { tradeId, sender: currentUsername, msg });
  input.value = '';
}

ge('accept-trade').onclick = () => {
  if (iAmReady) return;
  iAmReady = true;
  updateReadyDisplay();
  socket.emit('tradeAccept', { tradeId, username: currentUsername });
};

ge('decline-trade').onclick = () => {
  socket.emit('tradeCancel', { tradeId, username: currentUsername });
  window.location.href = '/stats';
};