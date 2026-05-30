const mongoose = require('mongoose');

const BazaarListingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  blookName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BazaarListing', BazaarListingSchema);