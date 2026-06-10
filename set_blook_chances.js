const connectDB = require("./backend/utils/db");
const Blook = require('./backend/models/Blook');
require('dotenv').config();

const mapping = {
  common: 60.0,
  uncommon: 19.0,
  rare: 15.0,
  epic: 4.50,
  legendary: 1.0,
  chroma: 0.4,
  mystical: 0.1,
};

async function run() {
  await connectDB();

  const blooks = await Blook.find({}).lean();
  if (!blooks.length) {
    console.log('No blooks found.');
    process.exit(0);
  }

  const bulkOps = [];
  let updated = 0;
  let skipped = 0;

  for (const b of blooks) {
    const rarity = (b.rarity || '').toString().toLowerCase().trim();
    const newChance = mapping[rarity];
    if (typeof newChance === 'number') {
      if (b.chance !== newChance) {
        bulkOps.push({
          updateOne: {
            filter: { _id: b._id },
            update: { $set: { chance: newChance } }
          }
        });
        updated++;
      }
    } else {
      console.warn(`Skipping blook ${b.blookName} (unknown rarity: "${b.rarity}")`);
      skipped++;
    }
  }

  if (bulkOps.length) {
    const res = await Blook.bulkWrite(bulkOps);
    console.log(`Bulk write complete. Matched: ${res.matchedCount || res.nMatched || 0}, Modified: ${res.modifiedCount || res.nModified || 0}`);
  } else {
    console.log('No changes required.');
  }

  console.log(`${updated} blooks updated, ${skipped} skipped.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
