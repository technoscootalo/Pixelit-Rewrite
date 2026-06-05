const mongoose = require('mongoose');

const BazaarListingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  blookName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: true },
  rarity: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('BazaarListing', BazaarListingSchema);