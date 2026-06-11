const mongoose = require('mongoose');

const StripePaymentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String },
  priceId: { type: String },
  fulfilled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StripePayment', StripePaymentSchema);