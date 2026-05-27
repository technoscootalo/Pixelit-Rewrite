const express = require("express");
const router = express.Router();
const Booster = require("../../models/Booster");
const UserBooster = require("../../models/UserBooster");

function verifyWebhookOrReject(req, res) {
  const secret = process.env.PAYPAL_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Missing PAYPAL_WEBHOOK_SECRET configuration" });
  }

  const provided =
    req.headers["x-paypal-webhook-secret"] ||
    req.headers["x-paypal-webhook"] ||
    req.headers["authorization"]?.toString().replace(/^Bearer\s+/i, "");

  if (!provided || provided !== secret) {
    return res.status(401).json({ error: "Invalid webhook secret authorization token" });
  }
  return null;
}

router.post("/", async (req, res) => {
  try {
    const guard = verifyWebhookOrReject(req, res);
    if (guard) return; 
    const payload = req.body || {};

    const customId =
      payload?.resource?.custom_id ||
      payload?.resource?.custom ||
      payload?.resource?.billing_agreement_id ||
      payload?.custom_id ||
      payload?.custom;

    const paypalTxnId =
      payload?.resource?.id ||
      payload?.resource?.transaction_id ||
      payload?.resource?.order_id ||
      payload?.id;

    if (!customId || typeof customId !== "string") {
      return res.status(400).json({ error: "Missing custom_id payload metadata" });
    }

    if (!paypalTxnId || typeof paypalTxnId !== "string") {
      return res.status(400).json({ error: "Missing PayPal transaction confirmation identifier" });
    }

    const parts = customId.split("|");
    if (parts.length < 2) {
      return res.status(400).json({ error: "Malformed custom_id formatting string structure" });
    }

    const userId = parts[0];
    const boosterCode = parts[1];

    if (!userId || !boosterCode) {
      return res.status(400).json({ error: "Invalid parsed data keys" });
    }

    const booster = await Booster.findOne({ code: boosterCode, visible: true });
    if (!booster) {
      return res.status(404).json({ error: "Booster definition not found in database collection" });
    }

    const existing = await UserBooster.findOne({
      userId,
      boosterId: booster._id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.json({ success: true, alreadyActivated: true });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(booster.durationMs));

    const created = await UserBooster.create({
      userId,
      boosterId: booster._id,
      status: "active",
      purchasedAt: now,
      activatedAt: now,
      expiresAt,
      quantity: 1,
    });

    return res.json({
      success: true,
      activated: created,
    });

  } catch (err) {
    console.error("boosterWebhook processing error trace:", err);
    return res.status(500).json({ error: "Internal Webhook logic operation failure" });
  }
});

module.exports = router;