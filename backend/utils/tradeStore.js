const { randomUUID } = require('crypto');

class TradeStore {
  constructor() {
    this.trades = new Map(); 
  }

  createTrade({ sender, recipient }) {
    const tradeId = randomUUID();

    const trade = {
      id: tradeId,
      tradeId,
      sender,
      recipient,
      senderOffer: { tokens: 0, pixels: [] },
      recipientOffer: { tokens: 0, pixels: [] },
      senderReady: false,
      recipientReady: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.trades.set(tradeId, trade);
    return trade;
  }

  getTrade(tradeId) {
    return this.trades.get(tradeId) || null;
  }

  deleteTrade(tradeId) {
    this.trades.delete(tradeId);
  }

  updateOffer({ tradeId, username, offer }) {
    const trade = this.getTrade(tradeId);
    if (!trade) return null;

    const sanitized = sanitizeOffer(offer);

    if (username === trade.sender) {
      trade.senderOffer = sanitized;
    } else if (username === trade.recipient) {
      trade.recipientOffer = sanitized;
    } else {
      return null;
    }

    trade.updatedAt = Date.now();
    if (username === trade.sender) trade.senderReady = false;
    if (username === trade.recipient) trade.recipientReady = false;

    return trade;
  }

  setReady({ tradeId, username, ready }) {
    const trade = this.getTrade(tradeId);
    if (!trade) return null;
    if (username === trade.sender) trade.senderReady = !!ready;
    if (username === trade.recipient) trade.recipientReady = !!ready;
    trade.updatedAt = Date.now();
    return trade;
  }
}

function sanitizeOffer(offer) {
  const out = {
    tokens: 0,
    pixels: [],
  };

  const tokens = Number(offer?.tokens ?? 0);
  out.tokens = Number.isFinite(tokens) && tokens > 0 ? Math.floor(tokens) : 0;

  const pixels = Array.isArray(offer?.pixels) ? offer.pixels : [];
  const map = new Map();

  for (const p of pixels) {
    if (!p) continue;
    const name = String(p.name || '').trim();
    if (!name) continue;

    const qty = Number(p.quantity ?? 0);
    const quantity = Number.isFinite(qty) ? Math.floor(qty) : 0;
    if (quantity <= 0) continue;

    map.set(name, (map.get(name) || 0) + quantity);
  }

  out.pixels = Array.from(map.entries()).map(([name, quantity]) => ({
    name,
    quantity,
    imageUrl: undefined,
    rarity: undefined,
    parent: undefined,
  }));

  return out;
}

module.exports = new TradeStore();

