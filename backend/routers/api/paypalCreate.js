const express = require("express");
const router = express.Router();
const Booster = require("../../models/Booster");

const paypal = require("@paypal/checkout-server-sdk");

function makePayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const base = (process.env.PAYPAL_BASE_URL || "sandbox").toLowerCase();

  if (!clientId || !clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env");
  }

  if (base.includes("live")) {
    const env = new paypal.core.LiveEnvironment(clientId, clientSecret);
    return new paypal.core.PayPalHttpClient(env);
  }

  const env = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(env);
}

router.post("/create", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { boosterCode } = req.body || {};
    if (!boosterCode || typeof boosterCode !== "string") {
      return res.status(400).json({ error: "Missing or invalid boosterCode" });
    }

    const booster = await Booster.findOne({ code: boosterCode, visible: true });
    if (!booster) {
      return res.status(404).json({ error: "Booster not found" });
    }

    const amount = Number(booster.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid booster price configuration" });
    }

    const customId = `${userId}|${boosterCode}`;

    const client = makePayPalClient();
    const currency = process.env.PAYPAL_CURRENCY || "USD";
    
    const request = new paypal.orders.OrdersCreateRequest();

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: `${booster.name} booster`,
          custom_id: customId,
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
      },
    });

    const order = await client.execute(request);
    const approvalUrl = order?.result?.links?.find((l) => l.rel === "approve")?.href;

    if (!approvalUrl) {
      return res.status(500).json({ error: "Missing PayPal approvalUrl link" });
    }

    return res.json({ approvalUrl });

  } catch (err) {
    console.error("================ PAYPAL ERROR DIAGNOSTICS ================");
    if (err.jsonData) {
      console.error("RAW ERROR FROM PAYPAL API:", JSON.stringify(err.jsonData, null, 2));
    } else {
      console.error("SERVER ERROR MESSAGE:", err.message);
    }
    console.error("==========================================================");
    
    const detailedMessage = err?.jsonData?.error_description || err?.message || "Internal Server Error";
    return res.status(500).json({ 
      error: "Failed to create PayPal order", 
      details: detailedMessage 
    });
  }
});

module.exports = router;