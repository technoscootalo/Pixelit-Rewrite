const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../../models/User');
const Badge = require('../../models/Badge');
const StripePayment = require('../../models/StripePayment');

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret ? Stripe(stripeSecret) : null;

router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured on server.' });

    const priceId = req.body.priceId || 'price_1TfB4PAE7YDfnyYkNHE8Zs93';
    const userId = req.session?.userId || req.body.userId || '';

    const successUrl = `${process.env.SITE_URL || 'https://izumiihd.xyz'}/store?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.SITE_URL || 'https://izumiihd.xyz'}/store`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      metadata: { userId: userId || '' },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: err.message });
  }
});

async function webhookHandler(req, res) {
  if (!stripe) return res.status(500).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  console.log('Stripe webhook received request, signature present:', !!sig, 'endpointSecret present:', !!endpointSecret);
  try {
    const bodyPreview = (req.body && req.body.toString) ? req.body.toString().slice(0, 200) : '<no-body>';
    console.log('Raw body preview:', bodyPreview);
  } catch (e) {
    console.log('Error previewing raw body', e);
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err && err.message, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log('Stripe webhook event type:', event.type);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      console.log('Processing checkout.session.completed for session:', sessionId);

      const existing = await StripePayment.findOne({ sessionId });
      if (existing) {
        console.log('Session already processed:', sessionId);
        return res.json({ received: true });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
      const priceIds = (lineItems.data || []).map(li => li.price?.id).filter(Boolean);
      console.log('Checkout session line price ids:', priceIds);
      const PLUS_PRICE = 'price_1TfB4PAE7YDfnyYkNHE8Zs93';
      const PLUS_BADGE_ID = '6a2464132913ade4a5b95544';

      if (priceIds.includes(PLUS_PRICE)) {
        const metadataUser = session.metadata?.userId;
        const email = session.customer_details?.email;

        let user = null;
        if (metadataUser) {
          user = await User.findOne({ id: metadataUser });
          console.log('Lookup by id returned:', !!user);
          if (!user) {
            try { user = await User.findOne({ _id: metadataUser }); console.log('Lookup by _id returned:', !!user); } catch (e) { console.log('Lookup by _id error', e.message); }
          }
        }
        if (!user && email) {
          user = await User.findOne({ email });
          console.log('Lookup by email returned:', !!user);
        }

        if (user) {
          let badgeDoc = null;
          try { badgeDoc = await Badge.findById(PLUS_BADGE_ID); } catch (e) { badgeDoc = null; }
          const badgeToPush = {
            badgeId: PLUS_BADGE_ID,
            _id: badgeDoc?._id || undefined,
            name: badgeDoc?.name || 'Plus',
            image: badgeDoc?.image || 'https://izumiihd.github.io/pixelitcdn/assets/img/badges/Plus.png'
          };

          const update = {
            $set: { role: 'Plus' },
            $addToSet: { badges: badgeToPush }
          };
          const resUpdate = await User.updateOne({ _id: user._id }, update);
          console.log('User update result:', resUpdate);
        } else {
          console.log('No user found for session. metadata.userId:', session.metadata?.userId, 'email:', session.customer_details?.email);
        }
      }
      await StripePayment.create({ sessionId, userId: session.metadata?.userId || null, priceId: priceIds[0] || null, fulfilled: true });
      console.log('Recorded StripePayment for session:', sessionId);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error', err && err.stack || err);
    return res.status(500).send('Webhook processing error');
  }
}

module.exports = { router, webhookHandler };
module.exports.router = router;
module.exports.webhookHandler = webhookHandler;
