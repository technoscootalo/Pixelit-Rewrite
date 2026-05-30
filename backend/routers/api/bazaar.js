const express = require("express");
const router = express.Router();
const BazaarListing = require("../../models/BazaarListing");
const User = require("../../models/User");

router.get('/listings', async (req, res) => {
  try {
    const listings = await BazaarListing.find().sort({ createdAt: -1 });
    
    res.json({
        currentUser: req.session.userId || null,
        listings: listings
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

router.post('/buy/:id', async (req, res) => {
    const currentUserId = req.session.userId;
    if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const listing = await BazaarListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found." });

        if (String(listing.userId) === String(currentUserId)) {
            return res.status(400).json({ error: "You cannot buy your own item." });
        }

        const buyer = await User.findOne({ id: currentUserId });
        if (!buyer) return res.status(404).json({ error: "Buyer account not found." });
        
        if (buyer.tokens < listing.price) return res.status(400).json({ error: "Not enough tokens." });

        const blookKey = `blooks.${listing.blookName.replace(/\./g, '_')}`;

        await User.updateOne(
            { id: buyer.id }, 
            { 
                $inc: { 
                    tokens: -listing.price,
                    [blookKey]: 1 
                },
                $push: { "blooks.items": listing.blookName }
            }
        );
        
        await User.updateOne({ id: listing.userId }, { $inc: { tokens: listing.price } });

        await BazaarListing.findByIdAndDelete(listing._id);

        res.json({ success: true });
    } catch (err) {
        console.error("PURCHASE CRASHED:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/remove/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            error: "You must be logged in to remove a listing." 
        });
    }

    try {

        const deletedListing = await BazaarListing.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });

        if (!deletedListing) {
            return res.status(404).json({ 
                error: "Listing not found or you do not have permission to delete it." 
            });
        }
        
        res.json({ 
            message: "Listing successfully removed from the bazaar." 
        });

    } catch (err) {
        console.error("Error removing listing:", err);
        res.status(500).json({ 
            error: "An internal server error occurred while removing the listing." 
        });
    }
});

router.get('/my-listings', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
        const myListings = await BazaarListing.find({ userId: req.session.userId });
        res.json(myListings);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;