const express = require('express');
const User = require('../../models/User');

const router = express.Router();

router.post('/getUserStats', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'You must be logged in.' });
        }

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ username: new RegExp(`^${escaped}$`, 'i') });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const userUnlocked = user.blooks
            ? Object.values(user.blooks).reduce((acc, v) => {
                const n = typeof v === 'number' ? v : Number(v?.amount ?? 0);
                return acc + (n > 0 ? 1 : 0);
              }, 0)
            : 0;

        const totalBlooks = await require('../../models/Blook').countDocuments({});

        const userStats = {
            username: user.username,
            pfp: user.pfp,
            role: user.role,
            tokens: user.tokens,
            opened: user.opened || 0,
            packsOpened: user.opened || 0,
            unlocked: userUnlocked,
            totalBlooks,
            stats: {
                sent: user.sent || 0,
                packsOpened: user.opened || 0
            },
            banner: user.banner || '',
            badges: (Array.isArray(user.badges) ? user.badges : []).map((b) => {
              if (!b || typeof b !== 'object') return b;
              return {
                badgeId: b.badgeId,
                _id: b._id,
                name: b.name,
                imageUrl: b.image,
                badgeImageUrl: b.image,
                image: b.image,
              };
            }),
        };

        res.json({ success: true, user: userStats });
    } catch (err) {
        console.error('getUserStats error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;