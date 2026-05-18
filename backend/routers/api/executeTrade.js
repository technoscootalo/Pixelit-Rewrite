const express = require('express');
const router = express.Router();

const User = require('../../models/User');
const tradeStore = require('../../utils/tradeStore');

function normalizeOffer(offer) {
  const out = { tokens: 0, pixels: [] };

  const tokens = Number(offer?.tokens ?? 0);
  out.tokens = Number.isFinite(tokens) && tokens > 0 ? Math.floor(tokens) : 0;

  const pixels = Array.isArray(offer?.pixels) ? offer.pixels : [];
  const map = new Map();

  for (const p of pixels) {
    if (!p) continue;
    const name = String(p.name || '').trim();
    if (!name) continue;
    const qty = Number(p.quantity ?? 0);
    const q = Number.isFinite(qty) ? Math.floor(qty) : 0;
    if (q <= 0) continue;
    map.set(name, (map.get(name) || 0) + q);
  }

  out.pixels = Array.from(map.entries()).map(([name, quantity]) => ({ name, quantity }));
  return out;
}

function ensureUserOwnsPixels(user, pixels) {
  const blooks = user?.blooks || {};
  for (const p of pixels) {
    const owned = Number(blooks[p.name] || 0);
    if (owned < p.quantity) return false;
  }
  return true;
}

function applyOfferTransfer({ fromUser, toUser, offer }) {
  if (offer.tokens > 0) {
    fromUser.tokens -= offer.tokens;
    toUser.tokens += offer.tokens;
  }

  for (const p of offer.pixels) {
    const current = Number(fromUser.blooks?.[p.name] || 0);
    fromUser.blooks[p.name] = current - p.quantity;
    if (fromUser.blooks[p.name] <= 0) delete fromUser.blooks[p.name];

    toUser.blooks[p.name] = Number(toUser.blooks?.[p.name] || 0) + p.quantity;
  }
}

router.post('/', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'Not logged in.' });
    }

    const { tradeId, partner, myOffer, theirOffer } = req.body || {};

    if (!tradeId || typeof tradeId !== 'string') {
      return res.status(400).json({ success: false, message: 'tradeId is required.' });
    }

    const trade = tradeStore.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found.' });
    }

    const requesterUserId = req.session.userId;
    const requestingUser = await User.findOne({ id: requesterUserId });
    if (!requestingUser) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const username = requestingUser.username;

    if (!partner || typeof partner !== 'string') {
      return res.status(400).json({ success: false, message: 'partner is required.' });
    }

    if (
      !((trade.sender === username && trade.recipient === partner) || (trade.recipient === username && trade.sender === partner))
    ) {
      return res.status(403).json({ success: false, message: 'Trade participants mismatch.' });
    }

    const senderUser = await User.findOne({ username: trade.sender });
    const recipientUser = await User.findOne({ username: trade.recipient });

    if (!senderUser || !recipientUser) {
      return res.status(404).json({ success: false, message: 'One of the users no longer exists.' });
    }

    if (!trade.senderReady || !trade.recipientReady) {
      return res.status(400).json({ success: false, message: 'Trade not ready.' });
    }

    const requestMyOffer = normalizeOffer(myOffer || {});
    const requestTheirOffer = normalizeOffer(theirOffer || {});

    let senderOffer;
    let recipientOffer;

    if (username === trade.sender) {
      senderOffer = requestMyOffer;
      recipientOffer = requestTheirOffer;
    } else {
      senderOffer = requestTheirOffer;
      recipientOffer = requestMyOffer;
    }
    if ((!myOffer || !Array.isArray(myOffer.pixels) || myOffer.pixels.length === 0) && trade.senderOffer) {
      senderOffer = normalizeOffer(trade.senderOffer);
    }
    if ((!theirOffer || !Array.isArray(theirOffer.pixels) || theirOffer.pixels.length === 0) && trade.recipientOffer) {
      recipientOffer = normalizeOffer(trade.recipientOffer);
    }


    const senderCan = senderOffer.tokens <= senderUser.tokens && ensureUserOwnsPixels(senderUser, senderOffer.pixels);
    const recipientCan = recipientOffer.tokens <= recipientUser.tokens && ensureUserOwnsPixels(recipientUser, recipientOffer.pixels);

    if (!senderCan || !recipientCan) {
      return res.status(400).json({ success: false, message: 'Trade failed: insufficient tokens or items.' });
    }

    applyOfferTransfer({ fromUser: senderUser, toUser: recipientUser, offer: senderOffer });
    applyOfferTransfer({ fromUser: recipientUser, toUser: senderUser, offer: recipientOffer });

    await senderUser.save();
    await recipientUser.save();

    tradeStore.deleteTrade(tradeId);

    return res.json({ success: true });
  } catch (err) {
    console.error('executeTrade error:', err);
    return res.status(500).json({ success: false, message: 'Server error executing trade.' });
  }
});

module.exports = router;

